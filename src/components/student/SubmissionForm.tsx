"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, UploadCloud, FileType2 } from "lucide-react";
import { toast } from "sonner";

interface SubmissionFormProps {
  assignmentId: string;
  studentId: string;
  onSuccess: () => void;
}

const MAX_SIZES = {
  audio: 50 * 1024 * 1024, // 50MB
  video: 500 * 1024 * 1024, // 500MB
  pdf: 20 * 1024 * 1024 // 20MB
};

export default function SubmissionForm({ assignmentId, studentId, onSuccess }: SubmissionFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Basic Validation
      const type = selectedFile.type;
      const size = selectedFile.size;
      
      let maxLimit = 0;
      let limitMsg = "";

      if (type.startsWith("audio/")) {
        maxLimit = MAX_SIZES.audio;
        limitMsg = "50MB";
      } else if (type.startsWith("video/")) {
        maxLimit = MAX_SIZES.video;
        limitMsg = "500MB";
      } else if (type === "application/pdf") {
        maxLimit = MAX_SIZES.pdf;
        limitMsg = "20MB";
      } else {
        toast.error("Unsupported file format. Please upload Audio, Video, or PDF.");
        setFile(null);
        return;
      }

      if (size > maxLimit) {
        toast.error(`File too large. Maximum size for this format is ${limitMsg}.`);
        setFile(null);
        e.target.value = ""; // reset input
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    
    try {
      // 1. Upload File via Supabase Storage implicitly matching configured RLS
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${assignmentId}/${studentId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("submissions")
        .upload(filePath, file);

      if (uploadError) throw new Error("File upload failed: " + uploadError.message);

      // 2. Fetch resulting explicit public URL mapping
      const { data: { publicUrl } } = supabase.storage
        .from("submissions")
        .getPublicUrl(filePath);

      // 3. Insert explicitly tracked submission record utilizing standard mapping bindings
      const { error: insertError } = await supabase
        .from("submissions")
        .insert({
          assignment_id: assignmentId,
          student_id: studentId,
          file_url: publicUrl,
          notes: notes.trim()
        });

      if (insertError) {
        throw new Error("Failed to record submission entry in database.");
      }

      // 4. Notify the teacher
      const { data: assignmentData } = await supabase
        .from('assignments')
        .select('title, lesson:lesson_id(course:course_id(teacher_id))')
        .eq('id', assignmentId)
        .single() as any;
        
      const teacherId = assignmentData?.lesson?.course?.teacher_id;
      if (teacherId) {
        await supabase.from('notifications').insert({
           user_id: teacherId,
           message: `New submission received for "${assignmentData?.title}"`,
           link: `/teacher/dashboard` 
        });
      }

      toast.success("Assignment submitted successfully!");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred during submission.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-dashed border-2 bg-slate-50/50">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-accent" />
          Submit Task
        </CardTitle>
        <CardDescription>
          Upload your performance or document for grading.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Input 
              id="file" 
              type="file" 
              accept="audio/*,video/*,.pdf"
              onChange={handleFileChange}
              disabled={isUploading}
              className="bg-white"
            />
            <p className="text-xs text-slate-500 mt-1">
              Limits: Audio (50MB), Video (500MB), PDF (20MB).
            </p>
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
              <FileType2 className="h-4 w-4" />
              <span className="truncate">{file.name}</span>
            </div>
          )}

          <div className="grid w-full items-center gap-1.5">
            <Textarea
              placeholder="Optional notes for your instructor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isUploading}
              className="bg-white"
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            type="submit" 
            disabled={!file || isUploading}
            className="w-full bg-accent hover:bg-accent/90"
          >
            {isUploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
            ) : "Submit Assignment" }
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
