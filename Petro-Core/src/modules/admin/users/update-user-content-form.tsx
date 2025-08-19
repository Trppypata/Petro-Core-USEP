/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useUpdateStudent } from "./hooks/useUpdateStudent";
import { useGetStudent } from "./hooks/useGetStudent";
import UserForm from "./user-form";
import { userSchema, defaultValues } from "./user.types";
import type { UserFormValues } from "./user.types";
import { toast } from "sonner";

interface Props {
  userID?: string;
}

const UpdateUserContentForm = ({ userID }: Props) => {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    mode: "onTouched",
    defaultValues,
  });

  const { isUpdatingStudent, updateStudentData } = useUpdateStudent();
  const { student, isLoadingStudent } = useGetStudent(userID);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Debug logging
  console.log("🔍 UpdateUserContentForm - userID:", userID);
  console.log("🔍 UpdateUserContentForm - student:", student);
  console.log("🔍 UpdateUserContentForm - isLoadingStudent:", isLoadingStudent);

  // Load student data when component mounts or student data changes
  useEffect(() => {
    if (student && isOpen) {
      console.log("📝 Loading student data into form:", student);
      
      // Create form data from student, excluding password for security
      const formData: UserFormValues = {
        first_name: student.first_name || "",
        last_name: student.last_name || "",
        middle_name: student.middle_name || "",
        email: student.email || "",
        password: "", // Don't pre-fill password for security
        position: student.position || "student",
        team: student.team || "BSIT",
        salary: student.salary || 0,
        allowance: student.allowance || 0,
        profile_url: student.profile_url || "",
        address: student.address || "",
        status: student.status || "active",
      };

      form.reset(formData);
    }
  }, [student, form, isOpen]);

  const onSubmit: SubmitHandler<UserFormValues> = async (data) => {
    try {
      console.log("📤 Submitting update with data:", data);

      if (!userID) {
        throw new Error("No user ID provided for update");
      }

      // If password is provided, validate it
      if (data.password && data.password.trim().length > 0 && data.password.trim().length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }

      // If password is empty, remove it from the data
      if (!data.password || data.password.trim().length === 0) {
        const { password, ...dataWithoutPassword } = data;
        await updateStudentData({ studentId: userID, data: dataWithoutPassword });
      } else {
        await updateStudentData({ studentId: userID, data });
      }

      console.log("✅ Student updated successfully!");
      toast.success("Student updated successfully!");
      
      // Check if role/position was changed and show special notification
      if (data.position && data.position !== student?.position) {
        toast.success(
          `Role updated from "${student?.position}" to "${data.position}" in database! The user can now login with the new role.`, 
          {
            duration: 6000,
          }
        );
        
        // Also show a more detailed message in the console
        console.log("🔄 ROLE CHANGE COMPLETED:");
        console.log(`   Previous role: ${student?.position}`);
        console.log(`   New role: ${data.position}`);
        console.log("   ✅ Updated in database, custom login will use new role");
      }
      
      // Check if password was changed and show special notification
      if (data.password && data.password.trim() !== "") {
        toast.success(
          "Password updated successfully! The user can now login with the new password.", 
          {
            duration: 6000,
          }
        );
        
        console.log("🔐 PASSWORD CHANGE COMPLETED:");
        console.log("   ✅ Password updated in database");
        console.log("   ✅ User can now login with the new password using custom login system");
      }
      
      setIsOpen(false);
    } catch (err: any) {
      console.error("❌ Error in onSubmit:", err);
      toast.error(`Error: ${err.message || "Unknown error occurred"}`);
    }
  };

  const resetForm = () => {
    form.reset(defaultValues);
  };

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit2 className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="p-0 flex flex-col h-full w-[400px] sm:w-[540px]">
        <header className="py-4 bg-overlay-bg border-b border-overlay-border px-6 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold">Update Student</h3>
            <p className="text-sm text-muted-foreground">
              Update student information and settings.
            </p>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto">
          {isLoadingStudent ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading student data...</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <UserForm form={form} />
            </div>
          )}
        </div>

        <SheetFooter className="flex-shrink-0 px-6 py-4 bg-overlay-bg border-t border-overlay-border">
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isUpdatingStudent}
              className="flex-1"
            >
              {isUpdatingStudent ? "Updating..." : "Update Student"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default UpdateUserContentForm;
