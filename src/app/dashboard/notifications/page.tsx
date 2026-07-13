import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";

export default async function NotificationsPage() {
  const session = await requireStationUser();

  const notifications = await prisma.notification.findMany({
    where: {
      stationId: session.stationId,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const serializedNotifications = notifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: (n as any).type || n.priority || "NORMAL",
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Station Notifications</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Stay updated on system alerts, outstanding checks, client rewards, and subscription statuses.
        </p>
      </div>
      <NotificationsPanel initialNotifications={serializedNotifications} />
    </div>
  );
}
