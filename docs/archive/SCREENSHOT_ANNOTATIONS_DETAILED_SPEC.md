# Screenshot & Annotations - Detailed Implementation Specification

> **Version:** 1.0  
> **Created:** February 4, 2026  
> **Purpose:** Attach chart screenshots to trades with annotation tools  
> **Priority:** P2 (High value - visual trade review)

---

## 1. Overview

### 1.1 Mục tiêu
Cho phép traders:
- Upload chart screenshots khi logging trades
- Vẽ annotations trên charts (lines, arrows, text)
- Unlimited storage (like TraderWaves)
- View screenshots trong trade review

### 1.2 User Stories
> "Tôi muốn capture chart tại thời điểm entry/exit để review sau"  
> "Unlimited screenshots" - TraderWaves selling point

### 1.3 Key Features

| Feature | Description |
|---------|-------------|
| Upload Screenshots | Drag & drop or click to upload |
| Multiple Images | Support nhiều screenshots per trade |
| Annotations | Draw lines, arrows, rectangles, text |
| Gallery View | View all trade screenshots |
| Cloud Storage | Supabase Storage với unlimited quota |

---

## 2. Database Changes

### 2.1 Screenshots Table

```sql
-- Screenshots table
CREATE TABLE IF NOT EXISTS trade_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES journal_trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- File info
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) DEFAULT 'image/png',
    
    -- Storage
    storage_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    
    -- Annotations (JSON)
    annotations JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trade_screenshots_trade ON trade_screenshots(trade_id);
CREATE INDEX idx_trade_screenshots_user ON trade_screenshots(user_id);
```

### 2.2 Prisma Schema Update

**File:** `prisma/schema.prisma`

```prisma
model TradeScreenshot {
  id            String   @id @default(uuid()) @db.Uuid
  tradeId       String   @map("trade_id") @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  
  filename      String   @db.VarChar(255)
  originalName  String?  @map("original_name") @db.VarChar(255)
  fileSize      Int      @map("file_size")
  mimeType      String   @default("image/png") @map("mime_type") @db.VarChar(100)
  
  storagePath   String   @map("storage_path") @db.VarChar(500)
  thumbnailPath String?  @map("thumbnail_path") @db.VarChar(500)
  
  annotations   Json     @default("[]") @db.JsonB
  caption       String?
  sortOrder     Int      @default(0) @map("sort_order")
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  trade         JournalTrade @relation(fields: [tradeId], references: [id], onDelete: Cascade)
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tradeId])
  @@index([userId])
  @@map("trade_screenshots")
}

model JournalTrade {
  // ... existing fields ...
  
  screenshots   TradeScreenshot[]
}
```

---

## 3. Annotation Types

### 3.1 Annotation Interface

**File:** `src/lib/annotations/types.ts`

```typescript
export type AnnotationType = 
  | "line"
  | "arrow"
  | "rectangle"
  | "circle"
  | "text"
  | "trendline"
  | "horizontal"
  | "vertical"
  | "freehand";

export interface Point {
  x: number;
  y: number;
}

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  color: string;
  strokeWidth: number;
  createdAt: string;
}

export interface LineAnnotation extends BaseAnnotation {
  type: "line" | "arrow" | "trendline";
  start: Point;
  end: Point;
}

export interface RectAnnotation extends BaseAnnotation {
  type: "rectangle";
  start: Point;
  end: Point;
  fill?: string;
  fillOpacity?: number;
}

export interface CircleAnnotation extends BaseAnnotation {
  type: "circle";
  center: Point;
  radius: number;
  fill?: string;
  fillOpacity?: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  position: Point;
  text: string;
  fontSize: number;
  fontWeight?: "normal" | "bold";
}

export interface HorizontalLine extends BaseAnnotation {
  type: "horizontal";
  y: number;
  label?: string;
}

export interface VerticalLine extends BaseAnnotation {
  type: "vertical";
  x: number;
  label?: string;
}

export interface FreehandAnnotation extends BaseAnnotation {
  type: "freehand";
  points: Point[];
}

export type Annotation =
  | LineAnnotation
  | RectAnnotation
  | CircleAnnotation
  | TextAnnotation
  | HorizontalLine
  | VerticalLine
  | FreehandAnnotation;

export const DEFAULT_COLORS = [
  "#00C888", // Green (Entry)
  "#EF4444", // Red (Stop Loss)
  "#3B82F6", // Blue (Take Profit)
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#FFFFFF", // White
  "#000000", // Black
];

export const DEFAULT_STROKE_WIDTHS = [1, 2, 3, 5, 8];
```

### 3.2 Annotation Utilities

**File:** `src/lib/annotations/utils.ts`

```typescript
import { v4 as uuidv4 } from "uuid";
import { Annotation, Point, AnnotationType } from "./types";

export function createAnnotation(
  type: AnnotationType,
  start: Point,
  end: Point,
  options: Partial<Annotation> = {}
): Annotation {
  const base = {
    id: uuidv4(),
    color: options.color || "#00C888",
    strokeWidth: options.strokeWidth || 2,
    createdAt: new Date().toISOString(),
  };

  switch (type) {
    case "line":
    case "arrow":
    case "trendline":
      return { ...base, type, start, end } as Annotation;

    case "rectangle":
      return {
        ...base,
        type,
        start,
        end,
        fillOpacity: 0.1,
      } as Annotation;

    case "circle":
      const radius = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      return {
        ...base,
        type,
        center: start,
        radius,
        fillOpacity: 0.1,
      } as Annotation;

    case "text":
      return {
        ...base,
        type,
        position: start,
        text: "Text",
        fontSize: 16,
      } as Annotation;

    case "horizontal":
      return { ...base, type, y: start.y } as Annotation;

    case "vertical":
      return { ...base, type, x: start.x } as Annotation;

    default:
      return { ...base, type: "line", start, end } as Annotation;
  }
}

export function annotationsToSVG(
  annotations: Annotation[],
  width: number,
  height: number
): string {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;

  for (const ann of annotations) {
    svg += renderAnnotation(ann);
  }

  svg += "</svg>";
  return svg;
}

function renderAnnotation(ann: Annotation): string {
  switch (ann.type) {
    case "line":
      return `<line x1="${ann.start.x}" y1="${ann.start.y}" x2="${ann.end.x}" y2="${ann.end.y}" stroke="${ann.color}" stroke-width="${ann.strokeWidth}"/>`;

    case "arrow":
      const angle = Math.atan2(ann.end.y - ann.start.y, ann.end.x - ann.start.x);
      const arrowLength = 10;
      const arrowAngle = Math.PI / 6;
      
      const x1 = ann.end.x - arrowLength * Math.cos(angle - arrowAngle);
      const y1 = ann.end.y - arrowLength * Math.sin(angle - arrowAngle);
      const x2 = ann.end.x - arrowLength * Math.cos(angle + arrowAngle);
      const y2 = ann.end.y - arrowLength * Math.sin(angle + arrowAngle);

      return `
        <line x1="${ann.start.x}" y1="${ann.start.y}" x2="${ann.end.x}" y2="${ann.end.y}" stroke="${ann.color}" stroke-width="${ann.strokeWidth}"/>
        <polygon points="${ann.end.x},${ann.end.y} ${x1},${y1} ${x2},${y2}" fill="${ann.color}"/>
      `;

    case "rectangle":
      const rectAnn = ann as any;
      const x = Math.min(rectAnn.start.x, rectAnn.end.x);
      const y = Math.min(rectAnn.start.y, rectAnn.end.y);
      const w = Math.abs(rectAnn.end.x - rectAnn.start.x);
      const h = Math.abs(rectAnn.end.y - rectAnn.start.y);
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="${ann.color}" stroke-width="${ann.strokeWidth}" fill="${ann.color}" fill-opacity="${rectAnn.fillOpacity || 0.1}"/>`;

    case "circle":
      const circAnn = ann as any;
      return `<circle cx="${circAnn.center.x}" cy="${circAnn.center.y}" r="${circAnn.radius}" stroke="${ann.color}" stroke-width="${ann.strokeWidth}" fill="${ann.color}" fill-opacity="${circAnn.fillOpacity || 0.1}"/>`;

    case "text":
      const textAnn = ann as any;
      return `<text x="${textAnn.position.x}" y="${textAnn.position.y}" fill="${ann.color}" font-size="${textAnn.fontSize}" font-weight="${textAnn.fontWeight || 'normal'}">${textAnn.text}</text>`;

    case "horizontal":
      return `<line x1="0" y1="${(ann as any).y}" x2="100%" y2="${(ann as any).y}" stroke="${ann.color}" stroke-width="${ann.strokeWidth}" stroke-dasharray="5,5"/>`;

    case "vertical":
      return `<line x1="${(ann as any).x}" y1="0" x2="${(ann as any).x}" y2="100%" stroke="${ann.color}" stroke-width="${ann.strokeWidth}" stroke-dasharray="5,5"/>`;

    default:
      return "";
  }
}
```

---

## 4. Supabase Storage Setup

### 4.1 Bucket Configuration

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trade-screenshots',
  'trade-screenshots',
  true,  -- Public for easy access
  10485760,  -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
);

-- RLS Policies
CREATE POLICY "Users can upload own screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trade-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'trade-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'trade-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read for shared screenshots (optional)
CREATE POLICY "Public can view screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'trade-screenshots');
```

---

## 5. API Endpoints

### 5.1 Upload Screenshot

**File:** `src/app/api/screenshots/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const tradeId = formData.get("tradeId") as string;
    const caption = formData.get("caption") as string;

    if (!file || !tradeId) {
      return NextResponse.json(
        { error: "Missing file or tradeId" },
        { status: 400 }
      );
    }

    // Verify trade ownership
    const trade = await prisma.journalTrade.findFirst({
      where: { id: tradeId, userId: user.id },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    // Read file
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate filenames
    const fileId = uuidv4();
    const ext = file.name.split(".").pop() || "png";
    const filename = `${fileId}.${ext}`;
    const thumbnailName = `${fileId}_thumb.webp`;
    
    const storagePath = `${user.id}/${tradeId}/${filename}`;
    const thumbnailPath = `${user.id}/${tradeId}/${thumbnailName}`;

    // Create thumbnail
    const thumbnail = await sharp(buffer)
      .resize(400, 300, { fit: "inside" })
      .webp({ quality: 80 })
      .toBuffer();

    // Upload to Supabase Storage
    const supabase = createClient();

    // Upload original
    const { error: uploadError } = await supabase.storage
      .from("trade-screenshots")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Upload thumbnail
    await supabase.storage
      .from("trade-screenshots")
      .upload(thumbnailPath, thumbnail, {
        contentType: "image/webp",
        upsert: false,
      });

    // Get count for sort order
    const count = await prisma.tradeScreenshot.count({
      where: { tradeId },
    });

    // Create database record
    const screenshot = await prisma.tradeScreenshot.create({
      data: {
        tradeId,
        userId: user.id,
        filename,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storagePath,
        thumbnailPath,
        caption,
        sortOrder: count,
        annotations: [],
      },
    });

    // Get public URLs
    const { data: urlData } = supabase.storage
      .from("trade-screenshots")
      .getPublicUrl(storagePath);

    const { data: thumbUrlData } = supabase.storage
      .from("trade-screenshots")
      .getPublicUrl(thumbnailPath);

    return NextResponse.json({
      success: true,
      screenshot: {
        ...screenshot,
        url: urlData.publicUrl,
        thumbnailUrl: thumbUrlData.publicUrl,
      },
    });
  } catch (error) {
    console.error("Screenshot upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload screenshot" },
      { status: 500 }
    );
  }
}
```

### 5.2 List Screenshots

**File:** `src/app/api/screenshots/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tradeId = request.nextUrl.searchParams.get("tradeId");

    const where: any = { userId: user.id };
    if (tradeId) {
      where.tradeId = tradeId;
    }

    const screenshots = await prisma.tradeScreenshot.findMany({
      where,
      orderBy: [{ tradeId: "desc" }, { sortOrder: "asc" }],
      include: {
        trade: {
          select: { symbol: true, entryDate: true, type: true },
        },
      },
    });

    // Add public URLs
    const supabase = createClient();
    const withUrls = screenshots.map((s) => {
      const { data: urlData } = supabase.storage
        .from("trade-screenshots")
        .getPublicUrl(s.storagePath);

      const { data: thumbUrlData } = s.thumbnailPath
        ? supabase.storage.from("trade-screenshots").getPublicUrl(s.thumbnailPath)
        : { data: null };

      return {
        ...s,
        url: urlData.publicUrl,
        thumbnailUrl: thumbUrlData?.publicUrl,
      };
    });

    return NextResponse.json(withUrls);
  } catch (error) {
    console.error("Screenshots list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch screenshots" },
      { status: 500 }
    );
  }
}
```

### 5.3 Update Annotations

**File:** `src/app/api/screenshots/[id]/annotations/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { annotations } = await request.json();

    // Verify ownership
    const screenshot = await prisma.tradeScreenshot.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!screenshot) {
      return NextResponse.json(
        { error: "Screenshot not found" },
        { status: 404 }
      );
    }

    // Update annotations
    const updated = await prisma.tradeScreenshot.update({
      where: { id: params.id },
      data: { annotations },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Annotations update error:", error);
    return NextResponse.json(
      { error: "Failed to update annotations" },
      { status: 500 }
    );
  }
}
```

### 5.4 Delete Screenshot

**File:** `src/app/api/screenshots/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get screenshot
    const screenshot = await prisma.tradeScreenshot.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!screenshot) {
      return NextResponse.json(
        { error: "Screenshot not found" },
        { status: 404 }
      );
    }

    // Delete from storage
    const supabase = createClient();
    
    await supabase.storage
      .from("trade-screenshots")
      .remove([screenshot.storagePath]);

    if (screenshot.thumbnailPath) {
      await supabase.storage
        .from("trade-screenshots")
        .remove([screenshot.thumbnailPath]);
    }

    // Delete from database
    await prisma.tradeScreenshot.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Screenshot delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete screenshot" },
      { status: 500 }
    );
  }
}
```

---

## 6. Components

### 6.1 File Structure

```
src/
├── components/
│   └── screenshots/
│       ├── ScreenshotUploader.tsx
│       ├── ScreenshotGallery.tsx
│       ├── ScreenshotViewer.tsx
│       ├── AnnotationCanvas.tsx
│       ├── AnnotationToolbar.tsx
│       ├── ColorPicker.tsx
│       └── index.ts
└── lib/
    └── annotations/
        ├── types.ts
        └── utils.ts
```

### 6.2 Screenshot Uploader

**File:** `src/components/screenshots/ScreenshotUploader.tsx`

```typescript
"use client";

import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ScreenshotUploaderProps {
  tradeId: string;
  onUpload: (screenshot: any) => void;
  maxFiles?: number;
}

export function ScreenshotUploader({
  tradeId,
  onUpload,
  maxFiles = 10,
}: ScreenshotUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      toast.error("Please drop image files only");
      return;
    }

    if (imageFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < imageFiles.length; i++) {
      try {
        const formData = new FormData();
        formData.append("file", imageFiles[i]);
        formData.append("tradeId", tradeId);

        const res = await fetch("/api/screenshots/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error);
        }

        const data = await res.json();
        onUpload(data.screenshot);

        setUploadProgress(((i + 1) / imageFiles.length) * 100);
      } catch (error: any) {
        toast.error(`Failed to upload ${imageFiles[i].name}: ${error.message}`);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
        ${isDragging
          ? "border-[#00C888] bg-[#00C888]/5"
          : "border-gray-200 dark:border-gray-700 hover:border-[#00C888]"
        }
        ${isUploading ? "pointer-events-none opacity-50" : ""}
      `}
      onClick={() => document.getElementById("screenshot-input")?.click()}
    >
      <input
        id="screenshot-input"
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(Array.from(e.target.files));
          }
        }}
      />

      {isUploading ? (
        <div className="space-y-3">
          <Loader2 size={40} className="mx-auto text-[#00C888] animate-spin" />
          <p className="text-sm text-gray-500">
            Uploading... {Math.round(uploadProgress)}%
          </p>
          <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-[#00C888] transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <>
          <ImageIcon size={40} className="mx-auto text-gray-500 mb-3" />
          <p className="text-sm text-gray-500 mb-1">
            <span className="font-medium text-[#00C888]">Click to upload</span>{" "}
            or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG, WEBP up to 10MB each
          </p>
        </>
      )}
    </div>
  );
}
```

### 6.3 Annotation Canvas

**File:** `src/components/screenshots/AnnotationCanvas.tsx`

```typescript
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Annotation, AnnotationType, Point } from "@/lib/annotations/types";
import { createAnnotation } from "@/lib/annotations/utils";

interface AnnotationCanvasProps {
  imageUrl: string;
  annotations: Annotation[];
  onChange: (annotations: Annotation[]) => void;
  activeTool: AnnotationType | null;
  activeColor: string;
  activeStrokeWidth: number;
  readOnly?: boolean;
}

export function AnnotationCanvas({
  imageUrl,
  annotations,
  onChange,
  activeTool,
  activeColor,
  activeStrokeWidth,
  readOnly = false,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      redraw();
    };
  }, [imageUrl]);

  // Redraw on annotations change
  useEffect(() => {
    redraw();
  }, [annotations, currentPoint]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imageRef.current;

    if (!canvas || !ctx || !img) return;

    // Set canvas size
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Draw existing annotations
    for (const ann of annotations) {
      drawAnnotation(ctx, ann, ann.id === selectedId);
    }

    // Draw current drawing
    if (isDrawing && startPoint && currentPoint && activeTool) {
      const tempAnnotation = createAnnotation(activeTool, startPoint, currentPoint, {
        color: activeColor,
        strokeWidth: activeStrokeWidth,
      });
      drawAnnotation(ctx, tempAnnotation, false);
    }
  }, [annotations, isDrawing, startPoint, currentPoint, activeTool, activeColor, activeStrokeWidth, selectedId]);

  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation, isSelected: boolean) => {
    ctx.strokeStyle = ann.color;
    ctx.lineWidth = ann.strokeWidth;
    ctx.lineCap = "round";

    if (isSelected) {
      ctx.shadowColor = "#00C888";
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowBlur = 0;
    }

    switch (ann.type) {
      case "line":
      case "trendline":
        ctx.beginPath();
        ctx.moveTo((ann as any).start.x, (ann as any).start.y);
        ctx.lineTo((ann as any).end.x, (ann as any).end.y);
        ctx.stroke();
        break;

      case "arrow":
        const start = (ann as any).start;
        const end = (ann as any).end;
        
        // Line
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLength = 15;
        
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLength * Math.cos(angle - Math.PI / 6),
          end.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLength * Math.cos(angle + Math.PI / 6),
          end.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        break;

      case "rectangle":
        const rect = ann as any;
        const x = Math.min(rect.start.x, rect.end.x);
        const y = Math.min(rect.start.y, rect.end.y);
        const w = Math.abs(rect.end.x - rect.start.x);
        const h = Math.abs(rect.end.y - rect.start.y);
        
        ctx.strokeRect(x, y, w, h);
        
        if (rect.fillOpacity) {
          ctx.fillStyle = ann.color;
          ctx.globalAlpha = rect.fillOpacity;
          ctx.fillRect(x, y, w, h);
          ctx.globalAlpha = 1;
        }
        break;

      case "circle":
        const circle = ann as any;
        ctx.beginPath();
        ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        if (circle.fillOpacity) {
          ctx.fillStyle = ann.color;
          ctx.globalAlpha = circle.fillOpacity;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        break;

      case "text":
        const text = ann as any;
        ctx.font = `${text.fontWeight || "normal"} ${text.fontSize}px sans-serif`;
        ctx.fillStyle = ann.color;
        ctx.fillText(text.text, text.position.x, text.position.y);
        break;

      case "horizontal":
        const hLine = ann as any;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, hLine.y);
        ctx.lineTo(ctx.canvas.width, hLine.y);
        ctx.stroke();
        ctx.setLineDash([]);
        break;

      case "vertical":
        const vLine = ann as any;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(vLine.x, 0);
        ctx.lineTo(vLine.x, ctx.canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
    }

    ctx.shadowBlur = 0;
  };

  const getMousePos = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly || !activeTool) return;

    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPoint(pos);
    setCurrentPoint(pos);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    setCurrentPoint(getMousePos(e));
  };

  const handleMouseUp = () => {
    if (!isDrawing || !startPoint || !currentPoint || !activeTool) {
      setIsDrawing(false);
      return;
    }

    const newAnnotation = createAnnotation(activeTool, startPoint, currentPoint, {
      color: activeColor,
      strokeWidth: activeStrokeWidth,
    });

    onChange([...annotations, newAnnotation]);

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      if (selectedId) {
        onChange(annotations.filter((a) => a.id !== selectedId));
        setSelectedId(null);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto max-h-[70vh] bg-gray-900 rounded-xl"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <canvas
        ref={canvasRef}
        className={`max-w-full ${activeTool ? "cursor-crosshair" : "cursor-default"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}
```

### 6.4 Annotation Toolbar

**File:** `src/components/screenshots/AnnotationToolbar.tsx`

```typescript
"use client";

import {
  MousePointer2,
  Minus,
  ArrowRight,
  Square,
  Circle,
  Type,
  TrendingUp,
  MoreHorizontal,
  MoreVertical,
  Undo,
  Trash2,
  Save,
} from "lucide-react";
import { AnnotationType, DEFAULT_COLORS, DEFAULT_STROKE_WIDTHS } from "@/lib/annotations/types";

interface AnnotationToolbarProps {
  activeTool: AnnotationType | null;
  onToolChange: (tool: AnnotationType | null) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  activeStrokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onSave: () => void;
  hasChanges: boolean;
  isSaving: boolean;
}

const TOOLS: { id: AnnotationType | null; icon: any; label: string }[] = [
  { id: null, icon: MousePointer2, label: "Select" },
  { id: "line", icon: Minus, label: "Line" },
  { id: "arrow", icon: ArrowRight, label: "Arrow" },
  { id: "rectangle", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Circle" },
  { id: "text", icon: Type, label: "Text" },
  { id: "trendline", icon: TrendingUp, label: "Trendline" },
  { id: "horizontal", icon: MoreHorizontal, label: "Horizontal" },
  { id: "vertical", icon: MoreVertical, label: "Vertical" },
];

export function AnnotationToolbar({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  activeStrokeWidth,
  onStrokeWidthChange,
  onUndo,
  onClear,
  onSave,
  hasChanges,
  isSaving,
}: AnnotationToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
      {/* Tools */}
      <div className="flex items-center gap-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.id || "select"}
            onClick={() => onToolChange(tool.id)}
            className={`
              p-2 rounded-lg transition-colors
              ${activeTool === tool.id
                ? "bg-[#00C888] text-white"
                : "text-gray-600 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
              }
            `}
            title={tool.label}
          >
            <tool.icon size={18} />
          </button>
        ))}
      </div>

      <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />

      {/* Colors */}
      <div className="flex items-center gap-1">
        {DEFAULT_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`
              w-6 h-6 rounded-full border-2 transition-transform
              ${activeColor === color ? "scale-125 border-white shadow-lg" : "border-transparent"}
            `}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />

      {/* Stroke Width */}
      <div className="flex items-center gap-1">
        {DEFAULT_STROKE_WIDTHS.map((width) => (
          <button
            key={width}
            onClick={() => onStrokeWidthChange(width)}
            className={`
              p-2 rounded-lg transition-colors
              ${activeStrokeWidth === width
                ? "bg-gray-300 dark:bg-gray-600"
                : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }
            `}
            title={`${width}px`}
          >
            <div
              className="rounded-full bg-current"
              style={{ width: width * 3 + 6, height: width + 2 }}
            />
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          className="p-2 text-gray-600 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
          title="Undo"
        >
          <Undo size={18} />
        </button>
        <button
          onClick={onClear}
          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
          title="Clear All"
        >
          <Trash2 size={18} />
        </button>
        <button
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className={`
            px-4 py-2 rounded-lg font-medium flex items-center gap-2
            ${hasChanges
              ? "bg-[#00C888] text-white hover:bg-[#00B377]"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
```

---

## 7. Integration with Journal Form

**File:** `src/components/journal/JournalForm.tsx` (addition)

```typescript
// Add to imports
import { ScreenshotUploader } from "@/components/screenshots/ScreenshotUploader";
import { ScreenshotGallery } from "@/components/screenshots/ScreenshotGallery";

// Add state
const [screenshots, setScreenshots] = useState<any[]>([]);

// Add to form (after notes section)
<div className="border-t border-gray-100 dark:border-gray-800 pt-6 mt-6">
  <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-4 flex items-center gap-2">
    <Image size={20} className="text-[#00C888]" />
    Screenshots
  </h3>

  {/* Uploader (only show if editing existing trade) */}
  {tradeId && (
    <ScreenshotUploader
      tradeId={tradeId}
      onUpload={(screenshot) => setScreenshots([...screenshots, screenshot])}
    />
  )}

  {/* Gallery */}
  {screenshots.length > 0 && (
    <ScreenshotGallery
      screenshots={screenshots}
      onDelete={(id) => setScreenshots(screenshots.filter(s => s.id !== id))}
    />
  )}

  {!tradeId && (
    <p className="text-sm text-gray-500 text-center py-4">
      Save the trade first, then you can add screenshots
    </p>
  )}
</div>
```

---

## 8. Test Cases

**File:** `src/lib/annotations/utils.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { createAnnotation, annotationsToSVG } from "./utils";

describe("createAnnotation", () => {
  it("should create line annotation", () => {
    const ann = createAnnotation(
      "line",
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { color: "#FF0000" }
    );

    expect(ann.type).toBe("line");
    expect(ann.color).toBe("#FF0000");
    expect((ann as any).start).toEqual({ x: 0, y: 0 });
    expect((ann as any).end).toEqual({ x: 100, y: 100 });
  });

  it("should create arrow annotation", () => {
    const ann = createAnnotation("arrow", { x: 0, y: 0 }, { x: 50, y: 50 });

    expect(ann.type).toBe("arrow");
    expect(ann.id).toBeDefined();
    expect(ann.createdAt).toBeDefined();
  });

  it("should create rectangle annotation", () => {
    const ann = createAnnotation("rectangle", { x: 10, y: 10 }, { x: 100, y: 100 });

    expect(ann.type).toBe("rectangle");
    expect((ann as any).fillOpacity).toBe(0.1);
  });

  it("should create circle annotation with calculated radius", () => {
    const ann = createAnnotation("circle", { x: 50, y: 50 }, { x: 100, y: 50 });

    expect(ann.type).toBe("circle");
    expect((ann as any).center).toEqual({ x: 50, y: 50 });
    expect((ann as any).radius).toBe(50); // Distance from center to end
  });

  it("should create text annotation", () => {
    const ann = createAnnotation("text", { x: 20, y: 30 }, { x: 20, y: 30 });

    expect(ann.type).toBe("text");
    expect((ann as any).position).toEqual({ x: 20, y: 30 });
    expect((ann as any).text).toBe("Text");
    expect((ann as any).fontSize).toBe(16);
  });

  it("should use default color if not provided", () => {
    const ann = createAnnotation("line", { x: 0, y: 0 }, { x: 10, y: 10 });

    expect(ann.color).toBe("#00C888");
  });

  it("should use default stroke width if not provided", () => {
    const ann = createAnnotation("line", { x: 0, y: 0 }, { x: 10, y: 10 });

    expect(ann.strokeWidth).toBe(2);
  });
});

describe("annotationsToSVG", () => {
  it("should generate valid SVG string", () => {
    const annotations = [
      createAnnotation("line", { x: 0, y: 0 }, { x: 100, y: 100 }),
    ];

    const svg = annotationsToSVG(annotations, 800, 600);

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("width=\"800\"");
    expect(svg).toContain("height=\"600\"");
  });

  it("should render line element", () => {
    const annotations = [
      createAnnotation("line", { x: 10, y: 20 }, { x: 30, y: 40 }),
    ];

    const svg = annotationsToSVG(annotations, 100, 100);

    expect(svg).toContain("<line");
    expect(svg).toContain("x1=\"10\"");
    expect(svg).toContain("y1=\"20\"");
  });

  it("should render multiple annotations", () => {
    const annotations = [
      createAnnotation("line", { x: 0, y: 0 }, { x: 10, y: 10 }),
      createAnnotation("rectangle", { x: 20, y: 20 }, { x: 50, y: 50 }),
    ];

    const svg = annotationsToSVG(annotations, 100, 100);

    expect(svg).toContain("<line");
    expect(svg).toContain("<rect");
  });
});
```

**File:** `tests/screenshots/upload.test.ts`

```typescript
import { describe, it, expect } from "vitest";

describe("Screenshot Upload Validation", () => {
  const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];

  it("should accept valid image types", () => {
    for (const type of validTypes) {
      expect(validTypes.includes(type)).toBe(true);
    }
  });

  it("should reject invalid file types", () => {
    const invalidTypes = ["application/pdf", "video/mp4", "text/plain"];
    
    for (const type of invalidTypes) {
      expect(validTypes.includes(type)).toBe(false);
    }
  });

  it("should check file size limit", () => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    expect(5 * 1024 * 1024 <= maxSize).toBe(true); // 5MB OK
    expect(11 * 1024 * 1024 <= maxSize).toBe(false); // 11MB too big
  });

  it("should generate unique filenames", () => {
    const filenames = new Set<string>();
    
    for (let i = 0; i < 100; i++) {
      const id = crypto.randomUUID();
      const filename = `${id}.png`;
      filenames.add(filename);
    }
    
    expect(filenames.size).toBe(100); // All unique
  });
});

describe("Screenshot Storage Path", () => {
  it("should construct correct storage path", () => {
    const userId = "user-123";
    const tradeId = "trade-456";
    const filename = "abc123.png";
    
    const path = `${userId}/${tradeId}/${filename}`;
    
    expect(path).toBe("user-123/trade-456/abc123.png");
  });

  it("should include user folder for RLS", () => {
    const path = "user-123/trade-456/image.png";
    const folders = path.split("/");
    
    expect(folders[0]).toBe("user-123"); // User ID first for RLS
  });
});
```

---

## 9. Files Summary

### Files to CREATE:

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `src/lib/annotations/types.ts` | Annotation types |
| 2 | `src/lib/annotations/utils.ts` | Annotation utilities |
| 3 | `src/app/api/screenshots/upload/route.ts` | Upload endpoint |
| 4 | `src/app/api/screenshots/route.ts` | List endpoint |
| 5 | `src/app/api/screenshots/[id]/route.ts` | Delete endpoint |
| 6 | `src/app/api/screenshots/[id]/annotations/route.ts` | Annotations endpoint |
| 7 | `src/components/screenshots/ScreenshotUploader.tsx` | Upload component |
| 8 | `src/components/screenshots/ScreenshotGallery.tsx` | Gallery grid |
| 9 | `src/components/screenshots/ScreenshotViewer.tsx` | Fullscreen viewer |
| 10 | `src/components/screenshots/AnnotationCanvas.tsx` | Drawing canvas |
| 11 | `src/components/screenshots/AnnotationToolbar.tsx` | Tools UI |
| 12 | `src/components/screenshots/ColorPicker.tsx` | Color picker |
| 13 | `src/components/screenshots/index.ts` | Exports |

### Files to MODIFY:

| # | File Path | Change |
|---|-----------|--------|
| 1 | `prisma/schema.prisma` | Add TradeScreenshot model |
| 2 | `src/components/journal/JournalForm.tsx` | Add screenshot section |

### Dependencies:

```bash
pnpm add sharp uuid
pnpm add -D @types/uuid
```

### Supabase Setup:

1. Create storage bucket `trade-screenshots`
2. Apply RLS policies (see Section 4)
3. Enable public access for image URLs

### Migration:

```bash
npx prisma migrate dev --name add_trade_screenshots
npx prisma generate
```

---

*Document End - Ready for Implementation*
