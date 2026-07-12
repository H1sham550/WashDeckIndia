import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Output paths
const CONVERSATION_ID = 'b1baeae7-478a-4b0b-8954-ac97b35ff471';
const BASE_ARTIFACTS_DIR = `C:/Users/athul/.gemini/antigravity/brain/${CONVERSATION_ID}`;
const SCREENSHOTS_DIR = path.join(BASE_ARTIFACTS_DIR, 'screenshots');
const REPORT_PATH = path.join(BASE_ARTIFACTS_DIR, 'screenshot_report.md');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const BASE_URL = 'https://washdeck.vercel.app';
const NAV_TIMEOUT = 20000; // 20 seconds timeout

// Pages to capture for Station Owner
const OWNER_PAGES = [
  { name: 'queue', path: '/dashboard', label: 'Queue / Jobs' },
  { name: 'finance', path: '/dashboard/finance', label: 'Finance Operations' },
  { name: 'services', path: '/dashboard/services', label: 'Service Catalog' },
  { name: 'staff', path: '/dashboard/staff', label: 'Staff Management' },
  { name: 'offers', path: '/dashboard/offers', label: 'Offers & Loyalty' },
  { name: 'recovery', path: '/dashboard/recovery', label: 'Revenue Recovery' },
  { name: 'analytics', path: '/dashboard/analytics', label: 'Business Analytics' },
  { name: 'settings', path: '/dashboard/settings', label: 'Station Settings' },
  { name: 'notifications', path: '/dashboard/notifications', label: 'Notifications Hub' },
  { name: 'vehicles', path: '/dashboard/vehicles', label: 'Vehicle Database' }
];

async function run() {
  console.log('Starting automated testing and screenshot capture (robust multi-context mode)...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const capturedImages = {
    desktop: [],
    mobile: []
  };

  try {
    // ==========================================
    // 1. DESKTOP VIEWPORT RUN (Clean Context 1)
    // ==========================================
    console.log('\n--- Running Desktop Viewport (1280x800) ---');
    const desktopContext = await browser.createBrowserContext();
    const desktopPage = await desktopContext.newPage();
    desktopPage.setDefaultNavigationTimeout(NAV_TIMEOUT);
    await desktopPage.setViewport({ width: 1280, height: 800 });

    // Public Pages
    console.log('Capturing Login Page (Desktop)...');
    try {
      await desktopPage.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      let screenshotName = 'desktop_login.png';
      await desktopPage.screenshot({ path: path.join(SCREENSHOTS_DIR, screenshotName) });
      capturedImages.desktop.push({ name: 'Login Page', file: screenshotName });
    } catch (err) {
      console.error('Failed to load/capture Login Page (Desktop):', err.message);
    }

    // Login as Owner
    console.log('Logging in as Station Owner (Desktop)...');
    try {
      await desktopPage.type('#identity', 'owner@example.com');
      await desktopPage.type('#password', 'WashDeck123');
      await Promise.all([
        desktopPage.click('button[type="submit"]'),
        desktopPage.waitForNavigation({ waitUntil: 'load' })
      ]);
      console.log('Logged in successfully (Desktop).');

      // Capture Owner Dashboard Pages
      for (const pageInfo of OWNER_PAGES) {
        console.log(`Capturing ${pageInfo.label} (Desktop)...`);
        try {
          await desktopPage.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'load' });
          // Let animations/charts render
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          let screenshotName = `desktop_owner_${pageInfo.name}.png`;
          await desktopPage.screenshot({ path: path.join(SCREENSHOTS_DIR, screenshotName) });
          capturedImages.desktop.push({ name: pageInfo.label, file: screenshotName });
        } catch (err) {
          console.error(`Failed to capture ${pageInfo.label} (Desktop):`, err.message);
        }
      }
    } catch (err) {
      console.error('Failed to login as Station Owner (Desktop):', err.message);
    }
    await desktopContext.close();

    // ==========================================
    // 2. SUPER ADMIN PORTAL RUN (Clean Context 2)
    // ==========================================
    console.log('\nLogging in as Super Admin (Desktop)...');
    try {
      const adminContext = await browser.createBrowserContext();
      const adminPage = await adminContext.newPage();
      adminPage.setDefaultNavigationTimeout(NAV_TIMEOUT);
      await adminPage.setViewport({ width: 1280, height: 800 });
      await adminPage.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
      await adminPage.type('#identity', 'admin@washdeck.local');
      await adminPage.type('#password', 'WashDeck123');
      await Promise.all([
        adminPage.click('button[type="submit"]'),
        adminPage.waitForNavigation({ waitUntil: 'load' })
      ]);
      
      console.log('Capturing Super Admin Portal...');
      await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: 'load' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      let screenshotName = 'desktop_super_admin.png';
      await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, screenshotName) });
      capturedImages.desktop.push({ name: 'Super Admin Portal', file: screenshotName });
      await adminContext.close();
    } catch (err) {
      console.error('Failed to login/capture Super Admin (Desktop):', err.message);
    }


    // ==========================================
    // 3. MOBILE VIEWPORT RUN (Clean Context 3)
    // ==========================================
    console.log('\n--- Running Mobile Viewport (390x844 - iPhone 12 Pro) ---');
    const mobileContext = await browser.createBrowserContext();
    const mobilePage = await mobileContext.newPage();
    mobilePage.setDefaultNavigationTimeout(NAV_TIMEOUT);
    await mobilePage.setViewport({ 
      width: 390, 
      height: 844, 
      isMobile: true,
      hasTouch: true
    });
    
    // Set user agent to mobile browser
    await mobilePage.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1');

    // Public Pages
    console.log('Capturing Login Page (Mobile)...');
    try {
      await mobilePage.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      let screenshotName = 'mobile_login.png';
      await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, screenshotName) });
      capturedImages.mobile.push({ name: 'Login Page', file: screenshotName });
    } catch (err) {
      console.error('Failed to load/capture Login Page (Mobile):', err.message);
    }

    // Login as Owner
    console.log('Logging in as Station Owner (Mobile)...');
    try {
      await mobilePage.type('#identity', 'owner@example.com');
      await mobilePage.type('#password', 'WashDeck123');
      await Promise.all([
        mobilePage.click('button[type="submit"]'),
        mobilePage.waitForNavigation({ waitUntil: 'load' })
      ]);
      console.log('Logged in successfully on mobile.');

      // Capture Mobile Dashboard Pages (Home, Finance, Services)
      const primaryMobilePages = OWNER_PAGES.slice(0, 3);
      for (const pageInfo of primaryMobilePages) {
        console.log(`Capturing ${pageInfo.label} (Mobile Tab)...`);
        try {
          await mobilePage.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'load' });
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          let screenshotName = `mobile_owner_${pageInfo.name}.png`;
          await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, screenshotName) });
          capturedImages.mobile.push({ name: pageInfo.label, file: screenshotName });
        } catch (err) {
          console.error(`Failed to capture ${pageInfo.label} (Mobile):`, err.message);
        }
      }

      // Capture the stateful "More" Slide-up Drawer
      console.log('Capturing "More" Slide-up Bottom Drawer (Mobile)...');
      try {
        await mobilePage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'load' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Locate the "More" button and click it
        const clicked = await mobilePage.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const moreBtn = buttons.find(b => b.textContent && b.textContent.includes('More'));
          if (moreBtn) {
            moreBtn.click();
            return true;
          }
          return false;
        });

        if (clicked) {
          console.log('More button clicked. Waiting for slide-up transition...');
          await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for CSS transition
          
          let screenshotName = 'mobile_owner_more_drawer_open.png';
          await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, screenshotName) });
          capturedImages.mobile.push({ name: 'More Operations Drawer (Open)', file: screenshotName });
        } else {
          console.error('Could not find More button to click on mobile bottom bar.');
        }
      } catch (err) {
        console.error('Failed to capture More drawer:', err.message);
      }

      // Capture Secondary Pages from Drawer (to verify responsive styling)
      const secondaryMobilePages = OWNER_PAGES.slice(3, 8);
      for (const pageInfo of secondaryMobilePages) {
        console.log(`Capturing Secondary page ${pageInfo.label} (Mobile)...`);
        try {
          await mobilePage.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'load' });
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          let screenshotName = `mobile_owner_${pageInfo.name}.png`;
          await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, screenshotName) });
          capturedImages.mobile.push({ name: pageInfo.label, file: screenshotName });
        } catch (err) {
          console.error(`Failed to capture ${pageInfo.label} (Mobile):`, err.message);
        }
      }
    } catch (err) {
      console.error('Failed to login as Station Owner (Mobile):', err.message);
    }
    await mobileContext.close();

  } catch (err) {
    console.error('An error occurred during execution:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }

  // ==========================================
  // 3. GENERATE MARKDOWN REPORT
  // ==========================================
  console.log('Generating markdown visual report...');
  
  let md = `# WashDeck Automated UI/UX Screenshot Report\n\n`;
  md += `This report contains automated screenshots captured across both **Desktop** (1280x800) and **Mobile** (390x844) viewports. It provides immediate visual verification of all key pages, layouts, and the newly implemented fixed mobile bottom navigation bar and stateful slide-up bottom drawer.\n\n`;
  md += `> [!NOTE]\n`;
  md += `> Screenshots were captured directly from the live production site: **https://washdeck.vercel.app**.\n\n`;
  
  if (capturedImages.mobile.length > 0) {
    md += `## 📱 Mobile Preview Showcase\n\n`;
    md += `Verify the fixed bottom navigation bar and the high-fidelity slide-up "More" drawer with blur backdrop.\n\n`;

    // Mobile Carousel
    md += `\`\`\`\`carousel\n`;
    for (let i = 0; i < capturedImages.mobile.length; i++) {
      const img = capturedImages.mobile[i];
      md += `![${img.name}](file:///${SCREENSHOTS_DIR.replace(/\\/g, '/')}/${img.file})\n`;
      if (i < capturedImages.mobile.length - 1) {
        md += `<!-- slide -->\n`;
      }
    }
    md += `\`\`\`\`\n\n`;
  }

  if (capturedImages.desktop.length > 0) {
    md += `---\n\n`;
    md += `## 💻 Desktop Preview Showcase\n\n`;
    md += `Verify the clean, full-screen desktop headers and grids which remain completely unaffected by the mobile updates.\n\n`;

    // Desktop Carousel
    md += `\`\`\`\`carousel\n`;
    for (let i = 0; i < capturedImages.desktop.length; i++) {
      const img = capturedImages.desktop[i];
      md += `![${img.name}](file:///${SCREENSHOTS_DIR.replace(/\\/g, '/')}/${img.file})\n`;
      if (i < capturedImages.desktop.length - 1) {
        md += `<!-- slide -->\n`;
      }
    }
    md += `\`\`\`\`\n\n`;
  }

  md += `---\n\n`;
  md += `## 📂 Index of Captured Pages\n\n`;
  
  md += `### Desktop Viewport\n`;
  for (const img of capturedImages.desktop) {
    md += `- **${img.name}**: [${img.file}](file:///${SCREENSHOTS_DIR.replace(/\\/g, '/')}/${img.file})\n`;
  }
  
  md += `\n### Mobile Viewport\n`;
  for (const img of capturedImages.mobile) {
    md += `- **${img.name}**: [${img.file}](file:///${SCREENSHOTS_DIR.replace(/\\/g, '/')}/${img.file})\n`;
  }

  md += `\n\n*Report generated automatically on ${new Date().toLocaleString()}*.\n`;

  fs.writeFileSync(REPORT_PATH, md);
  console.log(`Report successfully written to: ${REPORT_PATH}`);
}

run().catch(console.error);
