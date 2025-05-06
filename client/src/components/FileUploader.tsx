import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface FileUploaderProps {
  onUploadComplete: (uploadedPhotos: any[]) => void;
}

const FileUploader = ({ onUploadComplete }: FileUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Validate file size
    const invalidFiles = acceptedFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast({
        title: "Files too large",
        description: "One or more files exceed the 10MB limit.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('photos', file);
      });

      // Use fetch directly for FormData uploads instead of apiRequest
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      toast({
        title: "Upload successful",
        description: `${acceptedFiles.length} photos uploaded successfully.`
      });
      
      onUploadComplete(data);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: `There was an error uploading your photos. Did you try to upload more than 20 photos? Please try again. ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.heic']
    },
    disabled: isUploading
  });

  return (
    <div
      {...getRootProps()}
      className={`upload-area rounded-lg p-8 text-center mb-6 border-2 border-dashed transition-all ${
        isDragActive 
          ? 'border-primary bg-primary/5' 
          : 'border-gray-300 hover:border-primary hover:bg-primary/5'
      } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
      <h4 className="text-lg font-medium mb-2">
        {isDragActive ? 'Drop your photos here' : 'Drag & drop your photos here'}
      </h4>
      <p className="text-gray-500 mb-4">or</p>
      <Button 
        type="button"
        disabled={isUploading}
        className={isUploading ? 'opacity-50 cursor-not-allowed' : ''}
      >
        {isUploading ? 'Uploading...' : 'Browse Files'}
      </Button>
      <input {...getInputProps()} />
      <p className="text-sm text-gray-500 mt-4">
        Supported formats: JPG, PNG, HEIC. Max 10MB per photo.
      </p>
      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full animate-pulse w-full"></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Uploading your photos...</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
