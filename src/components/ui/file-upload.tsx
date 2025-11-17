"use client";

import { cn } from "@/lib/utils";
import { Upload, X, File as FileIcon, Image as ImageIcon } from "lucide-react";
import React, { useRef } from "react";
import { Input } from "./input";

interface FileUploadProps {
  onFileSelect: (files: File | FileList) => void;
  accept?: string;
  icon?: "image" | "file";
  title?: string;
  subtitle?: string;
  multiple?: boolean;
}

export function FileUpload({
  onFileSelect,
  accept,
  icon = "file",
  title = "Click to upload a file",
  subtitle = "Any file type",
  multiple = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      if (multiple) {
        onFileSelect(event.target.files);
      } else {
        const file = event.target.files[0];
        if (file) {
          onFileSelect(file);
        }
      }
    }
     if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const IconComponent = icon === 'image' ? ImageIcon : Upload;

  return (
    <>
      <Input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={accept}
        multiple={multiple}
      />
      <div
        className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50 p-6 text-center hover:bg-accent/50 cursor-pointer transition-colors"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <IconComponent className="mb-4 h-10 w-10 text-muted-foreground" />
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </>
  );
}
