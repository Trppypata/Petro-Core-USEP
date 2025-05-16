import { useEffect, useState } from "react";

export const useExamStatus = (): boolean => {
  const [examStatus, setExamStatus] = useState<boolean>(false);

  useEffect(() => {
    const examStartTime = localStorage.getItem("examStartTime");
    const examEndTime = localStorage.getItem("examEndTime");

    if (examStartTime && examEndTime) {
      const start = new Date(examStartTime).getTime();
      const end = new Date(examEndTime).getTime();
      const currentTime = new Date().getTime();

      if (currentTime >= start && currentTime <= end) {
        setExamStatus(true); // Exam is ongoing
      } else {
        setExamStatus(false); // Exam is not ongoing
      }
    }
  }, []);

  return examStatus;
};
