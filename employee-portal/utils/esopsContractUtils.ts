// Helper function to calculate vesting schedule
export function calculateVestingSchedule(
  totalAmount: number,
  startTime: number,
  cliffMonths: number,
  vestingMonths: number,
  currentTime: number
): {
  vestedAmount: number;
  unvestedAmount: number;
  cliffReached: boolean;
  fullyVested: boolean;
} {
  const cliffTime = startTime + (cliffMonths * 30 * 24 * 60 * 60); // Convert months to seconds
  const vestingEndTime = startTime + (vestingMonths * 30 * 24 * 60 * 60);
  
  let vestedAmount = 0;
  let cliffReached = currentTime >= cliffTime;
  let fullyVested = currentTime >= vestingEndTime;
  
  if (currentTime < cliffTime) {
    // Before cliff, no tokens vested
    vestedAmount = 0;
  } else if (currentTime >= vestingEndTime) {
    // After vesting period, all tokens vested
    vestedAmount = totalAmount;
  } else {
    // During vesting period, calculate linear vesting
    const vestingProgress = (currentTime - cliffTime) / (vestingEndTime - cliffTime);
    vestedAmount = Math.floor(totalAmount * vestingProgress);
  }
  
  return {
    vestedAmount,
    unvestedAmount: totalAmount - vestedAmount,
    cliffReached,
    fullyVested
  };
}

// Helper function to format vesting data for display
export function formatVestingData(vestingData: any): any {
  if (!vestingData) return null;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const schedule = calculateVestingSchedule(
    Number(vestingData.totalAmount),
    Number(vestingData.start),
    Number(vestingData.cliff),
    Number(vestingData.duration),
    currentTime
  );
  
  return {
    ...vestingData,
    ...schedule,
    totalAmount: Number(vestingData.totalAmount),
    claimed: Number(vestingData.claimed),
    start: Number(vestingData.start),
    cliff: Number(vestingData.cliff),
    duration: Number(vestingData.duration),
    claimableAmount: schedule.vestedAmount - Number(vestingData.claimed)
  };
} 