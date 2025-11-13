"use client";

import { cn } from "@/lib/utils";
import { Upload, X, File, Image as ImageIcon } from "lucide-react";
import React, { useRef, useState } from "react";
import { Button } from "./button";
import { Input } from "./input";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  icon?: "image" | "file";
  title?: string;
  subtitle?: string;
}

export function FileUpload({
  onFileSelect,
  accept,
  icon = "file",
  title = "Click to upload a file",
  subtitle = "Any file type"
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    onFileSelect(null);
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
      />
      <div
        className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50 p-6 text-center hover:bg-accent/50 cursor-pointer transition-colors relative",
            selectedFile && "p-4"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        {selectedFile ? (
          <div className="flex flex-col items-center text-center w-full">
            <File className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm font-semibold text-foreground truncate w-full" title={selectedFile.name}>
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={handleClearFile}
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear file</span>
            </Button>
          </div>
        ) : (
          <>
            <IconComponent className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </>
        )}
      </div>
    </>
  );
}
