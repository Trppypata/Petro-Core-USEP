import { useLocation } from "react-router-dom";

const useCheckActiveNav = () => {
  const { pathname } = useLocation();

  const checkActiveNav = (nav: string) => {
    const pathArr = pathname.split("/").filter((item) => item !== "");

    // Return true if the path is empty and nav is the root
    if (nav === "/" && pathArr.length === 0) return true;

    // Compare the last segment of the path with the provided nav string
    const lastSegment = pathArr[pathArr.length - 1];

    return lastSegment === nav; // Compare the last segment
  };

  return { checkActiveNav };
};

export default useCheckActiveNav;
