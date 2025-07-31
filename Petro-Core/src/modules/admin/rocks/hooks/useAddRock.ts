import { Q_KEYS } from "@/shared/qkeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { IRock } from "../rock.interface";
import { createRock } from "../services";
import { getRealAuthToken } from "../../minerals/services/minerals.service";

export function useAddRock() {
  const queryClient = useQueryClient();

  const { isPending: isAdding, mutateAsync: addRock } = useMutation({
    mutationFn: async (rockData: IRock) => {
      console.log("useAddRock mutation called with data:", rockData);

      // Check authentication
      const token = getRealAuthToken();
      if (!token) {
        console.error("No authentication token found");
        throw new Error(
          "Authentication required. Please log in and try again."
        );
      }

      // Filter out the 'origin' field which is causing schema errors
      const { origin, ...filteredRockData } = rockData;
      console.log("Filtered out origin field, sending data:", filteredRockData);

      return await createRock(filteredRockData);
    },

    onSuccess: (data) => {
      console.log("Rock added successfully:", data);
      toast.success(`Success! The rock has been added to the database.`);
      queryClient.invalidateQueries({ queryKey: [Q_KEYS.ROCKS] });
    },
    onError: (err: Error) => {
      console.error("Failed to add rock:", err);
      toast.error(`Failed to add rock: ${err.message}`);
    },
  });

  return { isAdding, addRock };
}
