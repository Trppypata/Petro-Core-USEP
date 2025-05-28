'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { UserFormValues } from './user.types';
import type { UseFormReturn } from 'react-hook-form';

const DEFAULT_AVATAR =
  'https://grammedia-vids.s3.ap-southeast-2.amazonaws.com/boy.png';

interface UserFormProps {
  form: UseFormReturn<UserFormValues>;
}

export const UserForm = ({ form }: UserFormProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Create preview URL when file is selected
  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // Cleanup
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedFile]);

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);

      // Log file details
      console.log('📂 File being uploaded:', {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      const formData = new FormData();
      formData.append('file', file);

      console.log(
        '🔄 About to send request to:',
        `${import.meta.env.VITE_local_url}/api/upload/uploadSingle`
      );

      const response = await fetch(
        `${import.meta.env.VITE_local_url}/api/upload/uploadSingle`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server response error:', errorText);
        throw new Error(
          `Failed to upload image: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('✅ Upload response:', data);

      if (!data.fileUrl) {
        throw new Error('No file URL received from server');
      }

      // Log the actual URL being returned
      console.log('🔗 File URL received:', data.fileUrl);

      if (data.fileUrl.includes('fakepath')) {
        console.error(
          '❌ Invalid URL received - contains fakepath:',
          data.fileUrl
        );
        throw new Error('Invalid file URL received from server');
      }

      // Return the URL directly from the server - ensuring it's a full URL
      return data.fileUrl;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-5">
      <Form {...form}>
        <form className="space-y-8">
          {/* Profile Image */}
          <FormField
            control={form.control}
            name="profile_url"
            render={({ field: { value, ...field } }) => (
              <FormItem>
                <FormLabel>Profile Image</FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        className="file:bg-primary file:text-primary-foreground file:border-0 file:mr-4 file:px-4 file:py-2 hover:file:bg-primary/90 file:cursor-pointer"
                        onInput={(e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            console.log('Selected file:', file.name);
                            setSelectedFile(file);

                            // Create a preview URL for immediate display
                            const localPreviewUrl = URL.createObjectURL(file);
                            setPreviewUrl(localPreviewUrl);

                            // Upload the file
                            (async () => {
                              try {
                                const fileUrl = await handleImageUpload(file);
                                if (fileUrl) {
                                  console.log(
                                    '✅ Setting form value with URL:',
                                    fileUrl
                                  );
                                  // Update the form with the URL from the server
                                  form.setValue('profile_url', fileUrl, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                    shouldTouch: true,
                                  });
                                }
                              } catch (error) {
                                console.error(
                                  '❌ Error handling image upload:',
                                  error
                                );
                              }
                            })();
                          }
                        }}
                        disabled={isUploading}
                        {...{ ...field, value: undefined }}
                      />
                      {isUploading && (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            Uploading...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Image Preview */}
                    <div className="mt-2">
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
                        <img
                          src={previewUrl ?? value ?? DEFAULT_AVATAR}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error(
                              '❌ Failed to load image:',
                              previewUrl ?? value
                            );
                            const img = e.target as HTMLImageElement;
                            img.src = DEFAULT_AVATAR;
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* First Name */}
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  First Name <span className="text-red-600">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Middle Name */}
          <FormField
            control={form.control}
            name="middle_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Middle Name</FormLabel>
                <FormControl>
                  <Input placeholder="A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Last Name <span className="text-red-600">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Email <span className="text-red-600">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="example@gmail.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Password <span className="text-red-600">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contact */}
          <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Contact <span className="text-red-600">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="09** *** ****" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Address <span className="text-red-600">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Street, City, Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Status <span className="text-red-600">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Position */}
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Position <span className="text-red-600">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hidden fields with default values */}
          <input type="hidden" {...form.register("team", { value: "BSIT" })} />
          <input type="hidden" {...form.register("salary", { value: 0 })} />
          <input type="hidden" {...form.register("allowance", { value: 0 })} />
        </form>
      </Form>
    </div>
  );
};

export default UserForm;
