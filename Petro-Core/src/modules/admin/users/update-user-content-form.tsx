/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useUpdateStudent } from "./hooks/useUpdateStudent";
import { useGetStudent } from "./hooks/useGetStudent";
import UserForm from "./user-form";
import { userSchema, defaultValues } from "./user.types";
import type { UserFormValues } from "./user.types";
import { Loader2 } from "lucide-react";

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
        contact: student.contact || "",
        profile_url: student.profile_url || "",
        address: student.address || "",
        status: student.status || "active",
      };

      form.reset(formData);
    }
  }, [student, form, isOpen]);

  const onSubmit: SubmitHandler<UserFormValues> = async (data) => {
    try {
      console.log("📤 Updating student with data:", data);
      console.log("📤 Using userID:", userID);

      if (!data) {
        throw new Error("Received undefined data in onSubmit!");
      }

      if (!userID) {
        throw new Error("Student ID is required for updating!");
      }

      // Remove password if it's empty (don't update password unless provided)
      const { password, ...updateData } = data;
      const finalUpdateData: Partial<UserFormValues> = { ...updateData };
      
      // Only include password if it's provided and not empty
      if (password && password.trim() !== "") {
        finalUpdateData.password = password;
      }

      console.log("📨 Sending update data:", finalUpdateData);

      const response = await updateStudentData({ 
        studentId: userID, 
        data: finalUpdateData 
      });
      console.log("✅ Student updated successfully!", response);

      setIsOpen(false);
    } catch (err: any) {
      console.error("❌ Error in onSubmit:", err);
      alert(`Error: ${err.message || "Unknown error occurred"}`);
    }
  };

  // Don't render if no userID is provided
  if (!userID) {
    return (
      <Button variant="default" size="icon" disabled>
        <EditIcon className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <Button variant="default" size="icon">
          <EditIcon className="w-4 h-4" />
        </Button>
      </SheetTrigger>

      <SheetContent className="p-0 flex flex-col h-full md:max-w-[40rem]">
        <header className="py-4 bg-overlay-bg border-b border-overlay-border px-6 flex-shrink-0">
          <div>
            <h3 className="text-lg font-medium">Update Student</h3>
            <p className="text-xs text-muted-foreground">
              Modify the student details and save changes.
            </p>
          </div>
        </header>

        {isLoadingStudent ? (
          <div className="flex-grow flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading student data...</span>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-grow overflow-y-auto"
          >
            <UserForm form={form} />
            <SheetFooter className="flex-shrink-0 px-6 py-4 bg-overlay-bg border-t border-overlay-border">
              <Button type="submit" disabled={isUpdatingStudent || isLoadingStudent}>
                {isUpdatingStudent ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating Student...
                  </>
                ) : (
                  "Update Student"
                )}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default UpdateUserContentForm;
