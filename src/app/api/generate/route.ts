import { NextRequest, NextResponse } from "next/server";

const FAL_KEY = process.env.FAL_KEY;

// 8 visual directions: use V3 for raster (more styles), V4 for vector
const DIRECTIONS = [
  { model: "fal-ai/recraft-v3", style: "realistic_image", label: "Photorealistic", type: "raster" },
  { model: "fal-ai/recraft-v3", style: "digital_illustration", label: "Digital Illustration", type: "raster" },
  { model: "fal-ai/recraft-v3", style: "any", label: "AI Creative (V3)", type: "raster" },
  { model: "fal-ai/recraft/v4/text-to-image", style: "any", label: "AI Creative (V4)", type: "raster" },
  { model: "fal-ai/recraft/v4/text-to-vector", style: "vector_illustration", label: "Vector Art", type: "vector" },
  { model: "fal-ai/recraft/v4/text-to-vector", style: "any", label: "Vector Creative", type: "vector" },
  { model: "fal-ai/recraft/v4/text-to-vector", style: "icon", label: "Vector Icon", type: "vector" },
  { model: "fal-ai/recraft/v4/text-to-vector", style: "digital_illustration", label: "Vector Illustration", type: "vector" },
];

async function generateWithFal(
  model: string,
  prompt: string,
  style: string
): Promise<{ url: string; type: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(`https://fal.run/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        style,
        image_size: "square_hd",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`fal.ai error for ${model}/${style}:`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.images?.[0]?.url || data.image?.url;

    if (!imageUrl) {
      console.error(`fal.ai no image URL for ${model}/${style}:`, JSON.stringify(data));
      return null;
    }

    return { url: imageUrl, type: model.includes("vector") ? "svg" : "webp" };
  } catch (err) {
    console.error(`Generation error for ${model}/${style}:`, err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const { prompt } = await request.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  if (!FAL_KEY) {
    return NextResponse.json({
      error: "API key not configured",
      directions: DIRECTIONS.map((d) => ({
        label: d.label,
        type: d.type,
        style: d.style,
        url: null,
        placeholder: true,
      })),
    }, { status: 200 });
  }

  // Generate all 8 directions in parallel
  const results = await Promise.allSettled(
    DIRECTIONS.map(async (dir) => {
      const result = await generateWithFal(dir.model, prompt, dir.style);
      return {
        label: dir.label,
        type: dir.type,
        style: dir.style,
        url: result?.url || null,
        outputType: result?.type || null,
        placeholder: !result,
      };
    })
  );

  const directions = results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : {
          label: DIRECTIONS[i].label,
          type: DIRECTIONS[i].type,
          style: DIRECTIONS[i].style,
          url: null,
          outputType: null,
          placeholder: true,
        }
  );

  return NextResponse.json({ directions, prompt });
}
