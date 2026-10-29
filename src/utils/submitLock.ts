export function createSubmitLock() {
  let locked = false;
  return {
    tryLock(): boolean {
      if (locked) {
        return false;
      }
      locked = true;
      return true;
    },
    unlock(): void {
      locked = false;
    },
  };
}
