import { test, expect } from '@playwright/test';

test.describe('SIH 26258 Adaptive Mechanized Desludging Digital Twin - End-to-End QA Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local digital twin application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('1. Application starts, displays SIH 26258 identity and persistent SIMULATED ENGINEERING DATA', async ({ page }) => {
    // Check main SIH 26258 title and subtitle
    await expect(page.getByRole('heading', { name: /SIH 26258 \| Adaptive Mechanized Desludging Digital Twin/i })).toBeVisible();
    await expect(page.getByText('Innovative Mechanized Desludging Models for Varied Climatic Zones and Hilly Terrains.')).toBeVisible();

    // Check exact SIMULATED ENGINEERING DATA persistent label in header
    await expect(page.locator('header').getByText('SIMULATED ENGINEERING DATA', { exact: true })).toBeVisible();

    // Check WebGL canvas container exists and is mounted
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Check industrial KPI cards are rendered
    await expect(page.getByText('Extraction Flow')).toBeVisible();
    await expect(page.getByText('Volume Extracted')).toBeVisible();
    await expect(page.getByText('Vault Remaining')).toBeVisible();

    // Check Mass Balance Invariant monitor
    await expect(page.getByText('Mass Balance Invariant')).toBeVisible();
  });

  test('2. Camera view presets and component inspection work interactively', async ({ page }) => {
    // Test viewport camera presets with exact matching
    const isoBtn = page.getByRole('button', { name: 'ISO', exact: true });
    const topBtn = page.getByRole('button', { name: 'Top', exact: true });
    const sideBtn = page.getByRole('button', { name: 'Side', exact: true });
    const resetBtn = page.getByRole('button', { name: 'Reset', exact: true }).first();

    await expect(isoBtn).toBeVisible();
    await isoBtn.click();
    await page.waitForTimeout(150);

    await expect(topBtn).toBeVisible();
    await topBtn.click();
    await page.waitForTimeout(150);

    await expect(sideBtn).toBeVisible();
    await sideBtn.click();
    await page.waitForTimeout(150);

    await resetBtn.click();
    await page.waitForTimeout(150);

    // Component inspection buttons
    const chassisChip = page.getByRole('button', { name: 'chassis', exact: true });
    if (await chassisChip.isVisible()) {
      await chassisChip.click();
      await expect(page.getByText(/Mobile Chassis/i)).toBeVisible();
    }

    const pumpChip = page.getByRole('button', { name: 'pump', exact: true });
    if (await pumpChip.isVisible()) {
      await pumpChip.click();
      await expect(page.getByText(/Vacuum Pump/i)).toBeVisible();
    }
  });

  test('3. Machine operating sequence controls: Start, Pause, Resume, Reset', async ({ page }) => {
    // Confirm initial state is IDLE
    const stateBadge = page.locator('header').getByText('IDLE', { exact: true });
    await expect(stateBadge).toBeVisible();

    // Click Start Cycle
    const startBtn = page.getByRole('button', { name: /Start Cycle/i }).first();
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Machine transitions out of IDLE (DEPLOY / PRIME)
    await expect(page.locator('header').getByText(/DEPLOY|PRIME|EXTRACT/i)).toBeVisible({ timeout: 5000 });

    // Click Pause
    const pauseBtn = page.getByRole('button', { name: /Pause/i }).first();
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();

    // Click Resume
    const resumeBtn = page.getByRole('button', { name: /Resume/i }).first();
    await expect(resumeBtn).toBeVisible();
    await resumeBtn.click();

    // Reset machine to baseline
    const resetMachineBtn = page.getByRole('button', { name: /Reset Machine/i }).or(page.getByRole('button', { name: 'Reset', exact: true })).first();
    await resetMachineBtn.click();

    // Confirm returned to IDLE
    await expect(page.locator('header').getByText('IDLE', { exact: true })).toBeVisible();
  });

  test('4. Emergency Stop trips FAULT state and unlatches via Clear Fault recovery', async ({ page }) => {
    // Start machine
    const startBtn = page.getByRole('button', { name: /Start Cycle/i }).first();
    await startBtn.click();

    // Trigger Emergency Stop (E-STOP)
    const eStopBtn = page.getByRole('button', { name: /E-STOP/i }).first();
    await expect(eStopBtn).toBeVisible();
    await eStopBtn.click();

    // State badge becomes FAULT
    await expect(page.locator('header').getByText('FAULT', { exact: true })).toBeVisible();

    // Verify Clear Fault button is present
    const clearFaultBtn = page.getByRole('button', { name: /Clear Fault/i }).first();
    await expect(clearFaultBtn).toBeVisible();
    await clearFaultBtn.click();

    // System safely returns to IDLE
    await expect(page.locator('header').getByText('IDLE', { exact: true })).toBeVisible();
  });

  test('5. Operating environments update terrain and engineering feasibility warnings', async ({ page }) => {
    // Select 2. Sloped Hilly (14°)
    const hillyBtn = page.getByRole('button', { name: /2. Sloped Hilly/i });
    await expect(hillyBtn).toBeVisible();
    await hillyBtn.click();
    await page.waitForTimeout(200);

    // Select 3. Narrow Alley (1.6m)
    const narrowBtn = page.getByRole('button', { name: /3. Narrow Alley/i });
    await expect(narrowBtn).toBeVisible();
    await narrowBtn.click();
    await page.waitForTimeout(200);

    // Open Compare Environments modal
    const compareBtn = page.getByRole('button', { name: /Compare Environments/i });
    await expect(compareBtn).toBeVisible();
    await compareBtn.click();

    // Verify comparison panel content
    await expect(page.getByText(/Operating Environment Comparison & Engineering Feasibility/i)).toBeVisible();
    await expect(page.getByText('Standard Municipal Highway & Asphalt Staging')).toBeVisible();

    // Close comparison panel
    const closeComparisonBtn = page.getByRole('button', { name: /Hide Comparison|Close Panel/i }).first();
    await closeComparisonBtn.click();
  });

  test('6. Chronological event log triggers CSV telemetry and event history export', async ({ page }) => {
    // Telemetry CSV download
    const telemetryCsvBtn = page.getByRole('button', { name: /Telemetry CSV/i });
    await expect(telemetryCsvBtn).toBeVisible();

    const [telemetryDownload] = await Promise.all([
      page.waitForEvent('download'),
      telemetryCsvBtn.click()
    ]);
    expect(telemetryDownload.suggestedFilename()).toContain('.csv');

    // Events CSV download
    const eventsCsvBtn = page.getByRole('button', { name: /Events CSV/i });
    await expect(eventsCsvBtn).toBeVisible();

    const [eventsDownload] = await Promise.all([
      page.waitForEvent('download'),
      eventsCsvBtn.click()
    ]);
    expect(eventsDownload.suggestedFilename()).toContain('.csv');
  });

  test('7. Left navigation switches across all 6 SIH engineering tabs', async ({ page }) => {
    // 1. 3D Machine
    const machineTab = page.getByRole('tab', { name: /3D Machine/i });
    await expect(machineTab).toBeVisible();
    await machineTab.click();
    await expect(page.getByText(/Viewport Camera Presets/i)).toBeVisible();

    // 2. Terrain Scenarios
    const terrainTab = page.getByRole('tab', { name: /Terrain Scenarios/i });
    await expect(terrainTab).toBeVisible();
    await terrainTab.click();
    await expect(page.getByText(/Climatic Zones & Hilly Terrain Feasibility Model/i)).toBeVisible();
    await expect(page.getByText(/Himalayan Cold Zone/i)).toBeVisible();

    // 3. Live Operations
    const operationsTab = page.getByRole('tab', { name: /Live Operations/i });
    await expect(operationsTab).toBeVisible();
    await operationsTab.click();
    await expect(page.getByText(/Live Operations & Machine Sequencing Console/i)).toBeVisible();
    await expect(page.getByText(/OSHA\/NIOSH Sewer Atmosphere Safety Matrix/i)).toBeVisible();

    // 4. Engineering Analysis
    const analysisTab = page.getByRole('tab', { name: /Engineering Analysis/i });
    await expect(analysisTab).toBeVisible();
    await analysisTab.click();
    await expect(page.getByText(/Engineering Analysis & Fluid Dynamics Audit/i)).toBeVisible();
    await expect(page.getByText(/Law of Conservation of Mass/i)).toBeVisible();

    // 5. Prototype Planning
    const prototypeTab = page.getByRole('tab', { name: /Prototype Planning/i });
    await expect(prototypeTab).toBeVisible();
    await prototypeTab.click();
    await expect(page.getByText(/Hardware Prototype Architecture & Fabrication Planning/i)).toBeVisible();
    await expect(page.getByText(/Technology Readiness Level/i)).toBeVisible();
    await expect(page.getByText(/Bill of Materials \(BOM\)/i)).toBeVisible();

    // 6. Overview (Return)
    const overviewTab = page.getByRole('tab', { name: /Overview/i });
    await expect(overviewTab).toBeVisible();
    await overviewTab.click();
    await expect(page.getByText(/Machine Operating Sequence/i)).toBeVisible();
  });

  test('8. Guided Demonstration Tour launches, advances, and completes', async ({ page }) => {
    // Launch guided demo tour
    const demoBtn = page.getByRole('button', { name: /Guided Demo/i }).first();
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    // Verify tour dialog is active
    await expect(page.getByText(/Interactive Guided Demonstration/i)).toBeVisible();
    await expect(page.getByText(/Step 1 of/i)).toBeVisible();

    // Advance stage
    const nextBtn = page.getByRole('button', { name: /Next Stage/i });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await page.waitForTimeout(200);
    await expect(page.getByText(/Step 2 of/i)).toBeVisible();

    // Toggle demo off from header
    const demoActiveBtn = page.getByRole('button', { name: /Demo Active/i }).first();
    await demoActiveBtn.click();
    await expect(page.getByText(/Interactive Guided Demonstration/i)).not.toBeVisible();
  });
});
