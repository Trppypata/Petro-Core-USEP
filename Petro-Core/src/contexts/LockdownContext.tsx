import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type LockdownContextType = {
  isLocked: boolean;
  setLockdown: (locked: boolean) => void;
  scheduledTime: string | null;
  setScheduledLockdown: (time: string | null) => void;
};

const LockdownContext = createContext<LockdownContextType | undefined>(undefined);

export function LockdownProvider({ children }: { children: ReactNode }) {
  // Get initial state from localStorage if available
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const saved = localStorage.getItem("system_lockdown");
    return saved ? JSON.parse(saved) : false;
  });
  
  const [scheduledTime, setScheduledTime] = useState<string | null>(() => {
    const saved = localStorage.getItem("scheduled_lockdown");
    return saved || null;
  });

  // Save lockdown state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("system_lockdown", JSON.stringify(isLocked));
  }, [isLocked]);

  // Save scheduled time to localStorage when it changes
  useEffect(() => {
    if (scheduledTime) {
      localStorage.setItem("scheduled_lockdown", scheduledTime);
    } else {
      localStorage.removeItem("scheduled_lockdown");
    }
  }, [scheduledTime]);

  // Check for scheduled lockdown
  useEffect(() => {
    if (!scheduledTime) return;

    const checkSchedule = () => {
      const now = new Date();
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      
      if (now.getHours() === hours && now.getMinutes() === minutes) {
        setIsLocked(true);
        setScheduledTime(null);
      }
    };

    const intervalId = setInterval(checkSchedule, 30000); // Check every 30 seconds
    return () => clearInterval(intervalId);
  }, [scheduledTime]);

  const setLockdown = (locked: boolean) => {
    setIsLocked(locked);
  };

  const setScheduledLockdown = (time: string | null) => {
    setScheduledTime(time);
  };

  return (
    <LockdownContext.Provider 
      value={{ 
        isLocked, 
        setLockdown, 
        scheduledTime, 
        setScheduledLockdown 
      }}
    >
      {children}
    </LockdownContext.Provider>
  );
}

export function useLockdown() {
  const context = useContext(LockdownContext);
  if (context === undefined) {
    throw new Error("useLockdown must be used within a LockdownProvider");
  }
  return context;
} 