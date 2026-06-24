import { prisma } from "@/lib/prisma";

export async function incrementLoyaltyStamps(
  tx: any, // Prisma transaction context
  stationId: string,
  vehicleId: string,
  jobCardId?: string
) {
  // 1. Fetch active offers for the station
  const activeOffers = await tx.offer.findMany({
    where: {
      stationId,
      isActive: true,
      isDeleted: false,
    },
    include: {
      offerVehicles: true,
    },
  });

  for (const offer of activeOffers) {
    // 2. Validate vehicle eligibility
    let isEligible = false;
    if (offer.type === "ALL_VEHICLES") {
      isEligible = true;
    } else if (offer.type === "SELECTED_VEHICLES") {
      isEligible = offer.offerVehicles.some((ov: any) => ov.vehicleId === vehicleId);
    } else if (offer.type === "FIRST_N_VEHICLES") {
      const limit = offer.rulesJson && typeof offer.rulesJson === "object" && "firstN" in (offer.rulesJson as any)
        ? parseInt((offer.rulesJson as any).firstN)
        : 50;
      
      const participantCount = await tx.vehicleOfferProgress.count({
        where: { offerId: offer.id },
      });
      const hasProgress = await tx.vehicleOfferProgress.findUnique({
        where: { vehicleId_offerId: { vehicleId, offerId: offer.id } },
      });
      isEligible = hasProgress ? true : (participantCount < limit);
    } else if (offer.type === "SERVICE_BASED") {
      const requiredServiceId = offer.rulesJson && typeof offer.rulesJson === "object" && "serviceId" in (offer.rulesJson as any)
        ? (offer.rulesJson as any).serviceId
        : null;
      if (requiredServiceId && jobCardId) {
        const jobServices = await tx.jobCardService.findMany({
          where: { jobCardId },
        });
        isEligible = jobServices.some((js: any) => js.serviceId === requiredServiceId);
      }
    } else if (offer.type === "VEHICLE_TYPE_BASED") {
      const requiredVehicleType = offer.rulesJson && typeof offer.rulesJson === "object" && "vehicleType" in (offer.rulesJson as any)
        ? (offer.rulesJson as any).vehicleType
        : null;
      if (requiredVehicleType) {
        const vehicle = await tx.vehicle.findUnique({
          where: { id: vehicleId },
          select: { vehicleType: true },
        });
        isEligible = vehicle?.vehicleType === requiredVehicleType;
      }
    }

    if (!isEligible) continue;

    // 3. Find or create progress
    const progress = await tx.vehicleOfferProgress.findUnique({
      where: {
        vehicleId_offerId: {
          vehicleId,
          offerId: offer.id,
        },
      },
    });

    if (!progress) {
      const newCount = 1;
      const rewardEarned = newCount >= offer.targetCount;
      await tx.vehicleOfferProgress.create({
        data: {
          vehicleId,
          offerId: offer.id,
          currentCount: newCount,
          rewardEarned,
        },
      });
    } else {
      // If reward is already earned but not redeemed yet, do not increment further
      if (progress.rewardEarned && !progress.rewardRedeemed) {
        continue;
      }

      let newCount = progress.currentCount;
      let rewardRedeemed = progress.rewardRedeemed;
      let redeemedAt = progress.redeemedAt;

      // If reward was already redeemed in a previous cycle, reset the counter
      if (progress.rewardRedeemed) {
        newCount = 0;
        rewardRedeemed = false;
        redeemedAt = null;
      }

      newCount += 1;
      const rewardEarned = newCount >= offer.targetCount;

      await tx.vehicleOfferProgress.update({
        where: { id: progress.id },
        data: {
          currentCount: newCount,
          rewardEarned,
          rewardRedeemed,
          redeemedAt,
        },
      });
    }
  }
}

export async function redeemOfferReward(
  tx: any,
  progressId: string
) {
  return tx.vehicleOfferProgress.update({
    where: { id: progressId },
    data: {
      currentCount: 0,
      rewardEarned: false,
      rewardRedeemed: true,
      redeemedAt: new Date(),
    },
  });
}
