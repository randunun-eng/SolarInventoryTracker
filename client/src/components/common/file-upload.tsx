import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, X, FileText, Image, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FileUploadProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  onUploadComplete: (urls: string[]) => void;
  currentFiles?: string[];
  isImage?: boolean;
  fieldName?: string; // image or datasheet
}

export default function FileUpload({
  label,
  accept = "*",
  multiple = false,
  maxFiles = 5,
  maxSize = 5, // 5MB default max size
  onUploadComplete,
  currentFiles = [],
  isImage = false,
  fieldName = "file",
}: FileUploadProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<string[]>(currentFiles);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    // Validate number of files
    if (multiple && selectedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can upload a maximum of ${maxFiles} files at once.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024; // Convert MB to bytes
    for (let i = 0; i < selectedFiles.length; i++) {
      if (selectedFiles[i].size > maxSizeBytes) {
        toast({
          title: "File too large",
          description: `${selectedFiles[i].name} exceeds the maximum file size of ${maxSize}MB.`,
          variant: "destructive",
        });
        return;
      }
    }

    setUploading(true);
    
    try {
      // Upload the file to the server
      const newUrls: string[] = [];
      const totalFiles = selectedFiles.length;
      
      for (let i = 0; i < totalFiles; i++) {
        // Create form data
        const formData = new FormData();
        formData.append(fieldName, selectedFiles[i]);
        
        // Update progress
        setProgress(Math.round(((i + 0.5) / totalFiles) * 100));
        
        try {
          // Direct fetch to server upload endpoint
          const response = await fetch(`/api/upload/${fieldName}`, {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }
          
          const result = await response.json();
          newUrls.push(result.url);
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          // Fallback to temporary blob URL if server upload fails
          const blobUrl = URL.createObjectURL(selectedFiles[i]);
          newUrls.push(blobUrl);
        }
        
        setProgress(Math.round(((i + 1) / totalFiles) * 100));
      }
      
      const updatedFiles = multiple ? [...files, ...newUrls] : newUrls;
      setFiles(updatedFiles);
      onUploadComplete(updatedFiles);
      
      toast({
        title: "Files uploaded",
        description: `Successfully uploaded ${newUrls.length} file(s)`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onUploadComplete(newFiles);
  };

  const FileIcon = isImage ? Image : FileText;

  return (
    <div className="space-y-4">
      <div>
        <Label>{label}</Label>
        
        <div className="mt-2 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-6 cursor-pointer hover:border-primary-500 transition-colors">
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className="w-8 h-8 mb-2 text-slate-500" />
              <p className="text-sm text-slate-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isImage ? "PNG, JPG or GIF" : "PDF, DOC, DOCX"} up to {maxSize}MB
                {multiple && ` (max ${maxFiles} files)`}
              </p>
            </div>
            <Input
              id="file-upload"
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Uploading...</span>
            <span className="text-sm text-slate-500">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <Label>Uploaded Files</Label>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-slate-50 rounded-md border border-slate-200"
              >
                <div className="flex items-center space-x-2">
                  <FileIcon className="h-5 w-5 text-slate-500" />
                  <span className="text-sm truncate max-w-[200px]">
                    {isImage ? `Image ${index + 1}` : `File ${index + 1}`}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
