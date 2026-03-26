import { NextRequest, NextResponse } from "next/server";

const FAL_KEY = process.env.FAL_KEY;

const STYLES = [
  { id: "realistic_image", label: "Photorealistic" },
  { id: "digital_illustration", label: "Digital Illustration" },
  { id: "vector_illustration", label: "Vector Art" },
  { id: "icon", label: "Icon Design" },
  { id: "any", label: "AI's Choice" },
];

// 8 visual directions: 5 raster styles + 3 vector variants
const DIRECTIONS = [
  { model: "fal-ai/recraft/v4/text-to-image", style: "realistic_image", label: "Photorealistic", type: "raster" },
  { model: "fal-ai/recraft/v4/text-to-image", style: "digital_illustration", label: "Digital Illustration", type: "raster" },
  { model: "fal-ai/recraft/v4/text-to-image", style: "any", label: "AI Creative", type: "raster" },
  { model: "fal-ai/recraft/v4/text-to-image", style: "icon", label: "Icon Design", type: "raster" },
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
    const response = await fetch(`https://queue.fal.run/${model}`, {
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`fal.ai error for ${model}/${style}:`, response.status, errorText);
      return null;
    }

    const data = await response.json();

    // Queue-based: poll for result using the URLs returned by fal.ai
    if (data.request_id) {
      const statusUrl = data.status_url || `https://queue.fal.run/fal-ai/recraft/requests/${data.request_id}/status`;
      const responseUrl = data.response_url || `https://queue.fal.run/fal-ai/recraft/requests/${data.request_id}`;
      let attempts = 0;
      while (attempts < 60) {
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await fetch(statusUrl, {
          headers: { Authorization: `Key ${FAL_KEY}` },
        });
        const status = await statusRes.json();
        if (status.status === "COMPLETED") {
          const resultRes = await fetch(responseUrl, {
            headers: { Authorization: `Key ${FAL_KEY}` },
          });
          const result = await resultRes.json();
          const imageUrl = result.images?.[0]?.url || result.image?.url;
          return imageUrl ? { url: imageUrl, type: model.includes("vector") ? "svg" : "webp" } : null;
        }
        if (status.status === "FAILED") {
          console.error(`fal.ai generation failed for ${model}/${style}`);
          return null;
        }
        attempts++;
      }
      return null;
    }

    // Synchronous response
    const imageUrl = data.images?.[0]?.url || data.image?.url;
    return imageUrl ? { url: imageUrl, type: model.includes("vector") ? "svg" : "webp" } : null;
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
          placeholder: true,
        }
  );

  return NextResponse.json({ directions, prompt });
}
