precision mediump float;

#define pi 3.1415926
uniform float iTime;
uniform vec2 iResolution;
uniform sampler2D tex;
uniform float flashGlitch;

float fishEyeX = 0.01 * (flashGlitch * 0.3); // Adjust for horizontal fisheye strength
float fishEyeY = 0.07 * (flashGlitch * 0.3); // Adjust for vertical fisheye strength

vec2 CRTCurveUV(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    vec2 offset = abs(uv.yx) / vec2(6.0, 4.0);
    uv += uv * offset * offset;
    uv = uv * 0.5 + 0.5;
    return uv;
}

vec2 drawFisheye(vec2 uv) {
    // Fisheye effect calculation
    vec2 centeredUV = uv * 2.0 - 1.0; // Centering UV to [-1, 1]
    float r = length(centeredUV);
    float theta = atan(centeredUV.y, centeredUV.x);
    
    // Apply fisheye distortion
    r = r * (1.0 + r * (fishEyeX * r + fishEyeY));
    
    // Convert back to polar coordinates
    vec2 distortedUV = vec2(cos(theta), sin(theta)) * r * 0.5 + 0.5; // Normalize back to [0, 1]
    return distortedUV;
}

void drawVignette(inout vec3 color, vec2 uv) {
    // Check if UV coordinates are within the valid range
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        color = vec3(0.0); // Set color to black if outside range
        return; // Exit the function early
    }
    
    float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
    vignette = clamp(pow(16.0 * vignette, 0.3), 0.0, 1.0);
    color *= vignette;
}

void drawScanline(inout vec3 color, vec2 uv) {
    float scanline = clamp(0.95 + 0.05 * cos(3.14 * (uv.y + 0.008 * iTime) * 240.0), 0.0, 1.0);
    float grille = 0.85 + 0.15 * clamp(1.5 * cos(3.14 * uv.x * 640.0), 0.0, 1.0);
    color *= scanline * grille * 1.2;
}

void drawVerticalArtifacts(inout vec3 color, vec2 uv) {
	float glitch = smoothstep(0.5, 0.3, sin(uv.x * iResolution.x * 90.0 + iTime));
  color += glitch * vec3(0.1);
}

vec2 fault(vec2 uv, float s)
{
    float v = pow(0.5 - 0.5 * cos(2.0 * pi * uv.y), 100.0) * sin(2.0 * pi * uv.y);
    uv.x += v * s;
    return uv;
}

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 rnd(vec2 uv)
{    
    return vec2(rand(uv), rand(uv));
}

vec4 frag(vec2 fragCoord, vec2 uv, vec4 fragColor, sampler2D tex) {
    // Sample the existing content
    vec4 texColor = texture2D(tex, uv);
    vec3 color = texColor.rgb;
		float t = iTime / 10.0;

    // Apply CRT curvature
    vec2 crtUV = CRTCurveUV(uv);
    if (crtUV.x < 0.0 || crtUV.x > 1.0 || crtUV.y < 0.0 || crtUV.y > 1.0) {
        color = vec3(0.0);
    } else {
        // Apply fisheye effect
        vec2 fisheyeUV = drawFisheye(crtUV);
        // Sample color with fisheye UV coordinates
				if(flashGlitch == 0.0) {
					fisheyeUV = fault(fisheyeUV + vec2(0.0, fract(t * 5.0)), 5.0 * pow(1.0, 5.0)) - vec2(0.0, fract(t * 5.0));
				}
				fisheyeUV = fault(fisheyeUV + vec2(0.0, fract(t * 2.0)), 1.0 * pow(0.4, 4.0)) - vec2(0.0, fract(t * 2.0));
				fisheyeUV = fault(fisheyeUV + vec2(0.0, fract(t * 1.0)), 1.0 * pow(0.3, 3.0)) - vec2(0.0, fract(t * 1.0));

        vec4 fisheyeColor = texture2D(tex, fisheyeUV);
        color = fisheyeColor.rgb;

        // Apply vignette and scanline effects
        drawVerticalArtifacts(color, uv);
        drawScanline(color, uv);
        drawVignette(color, fisheyeUV);

    }

    // Return the modified color with the alpha preserved
    return vec4(color, texColor.a);
}
