import kaplay from "kaplay";
import "kaplay/global";
import defaultText from "/src/defaultText.txt?raw";
// Use https://patorjk.com/software/taag to generate ASCII art

const urlParams = new URLSearchParams(window.location.search);
let contentString = urlParams.get("content") ?? defaultText;
let imageLink = decodeURIComponent(urlParams.get("image") || "");

document.getElementById("contentText").value = contentString;
document.getElementById("imageLink").value = imageLink;

generateLink();

document.getElementById("clearButton").addEventListener("click", () => {
  document.getElementById("contentText").value = defaultText;
  generateLink();
});

const colors = { g: "green", y: "yellow", b: "blue" };
const colorSelect = document.getElementById("color");
const currentColor = colors[urlParams.get("c")] ?? "green";
document.body.classList.add(currentColor);
colorSelect.value = currentColor;

colorSelect.addEventListener("change", () => {
  generateLink();
  setColors(document.getElementById("color").value.slice(0, 1));
});

const crtColors = {
  g: { foreground: [0, 255, 51], background: [0, 80, 0], tint: [0.0, 1.0, 0.0] },
  y: { foreground: [235, 231, 40], background: [85, 68, 0], tint: [1.0, 1.0, 0.0] },
  b: { foreground: [124, 123, 218], background: [52, 40, 152], tint: [0.3, 0.3, 1.0] },
};

let slowType = urlParams.get("slowtype") !== "false";
const blinkSpeed = 530;
let hasCursor = false;
const cursorChar = "█";
let glitch = 1;
let glitchTimer = 0;
let typeTimer = 0;
let finishedTyping = false;
let touchStartPos = null;
const zoomFactor = 1.5; // Adjust for preferred step size
let zoomEffect = 0.0;
let zoomEffectTimer;
const snapSize = 50;

kaplay({
  background: [0, 80, 0],
  loadingScreen: false,
});
let realPosition = vec2(0, 0);

let mapLoaded;
if (imageLink) {
  mapLoaded = loadSprite("map", imageLink).catch((e) => {
    console.error(e);
    add([
      text("Failed to load image.", {
        size: 30, // Text size
        width: width(),
        align: "center", // Left alignment
        font: "console", // Font name
      }),
      anchor("center"),
      pos(width() / 2, height() / 2),
      color(255, 255, 255),
    ]);
  });
}

loadFont("console", "/crt-monitor/monofonto_rg.otf");

loadShaderURL("crt", null, "/crt-monitor/shaders/crt.frag");

// loadSound("click", "/crt-monitor/click.wav");

const scrollbar = add([rect(20, height()), pos(width() - 50, 25), color(0, 0, 0), opacity(0.5)]);
scrollbar.hidden = true;

let cameraPosition = camPos();
let cameraScale = 1;

let tintColor = rgb(1, 1, 0);
let contentObj;
if (imageLink) {
  loadShader(
    "tint",
    null,
    `
		uniform vec3 u_tint;

		vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
			vec4 c = def_frag();
			float luminance = dot(c.rgb, vec3(0.3, 0.59, 0.11));
			vec3 greyscale = vec3(luminance);
			float mixFactor = smoothstep(0.0, 1.0, luminance);
			return mix(vec4(greyscale,c.a), vec4(u_tint, 1.0), mixFactor * 1.0);	
		}
`
  );

  contentObj = add([
    sprite("map"),
    scale(1, 1),
    anchor("top"),
    pos(width() / 2, 0),
    shader("tint", () => ({ u_tint: tintColor })),
  ]);
  realPosition = vec2(width() / 2, height() / 2);
  setTimeout(resize, 100);
} else {
  // Create a text object
  contentObj = add([
    text(slowType ? "" : contentString, {
      size: 27.3, // Text size
      width: 1920, // Width of the text object
      align: "left", // Left alignment
      font: "console", // Font name
    }),
    scale(document.body.clientWidth / 1920, 1),
    pos(10, 10), // Position at the top-left corner
    color(255, 255, 255),
  ]);
}

setColors();

function resize() {
  updateScrollbar();
  if (scrollbar.hidden && contentObj.pos.y < 0) contentObj.pos.y = 0;
  if (imageLink) return;
  kaplay.width = document.body.clientWidth;
  contentObj.scale.x = document.body.clientWidth / contentObj.width;
  scrollbar.pos.x = width() - 50;
}

onResize(() => {
  resize();
});

onTouchStart(({ y }) => {
  touchStartPos = y;
});
onTouchMove(({ y }) => {
  if (scrollbar.hidden || imageLink) return;
  const delta = y - touchStartPos;
  touchStartPos = y;
  if (delta < 0 && contentObj.height + contentObj.pos.y < height() - 25) return;
  contentObj.pos.y = Math.min(0, contentObj.pos.y + delta);
  updateScrollbar();
});
onTouchEnd(() => {
  touchStartPos = null;
});

onKeyPress((ch) => {
  switch (ch) {
    case "escape": {
      if (imageLink) return;
      if (slowType) {
        slowType = false;
        contentObj.text = contentString;
        updateScrollbar();
      }
      break;
    }
    case "r": {
      if (imageLink) return;
      contentObj.text = "";
      contentObj.pos.y = 0;
      hasCursor = false;
      finishedTyping = false;
      slowType = true;
      updateScrollbar();
      break;
    }
    case "e": {
      const overlay = document.getElementById("overlay");
      overlay.classList.remove("hidden");
      document.getElementById("contentText").focus();
      break;
    }
  }
});

onKeyPressRepeat("up", () => {
  if (scrollbar.hidden) return;
  contentObj.pos.y = Math.min(0, contentObj.pos.y + 34);
  updateScrollbar();
});

onKeyPressRepeat("down", () => {
  if (contentObj.height + contentObj.pos.y < height() - 25) return;
  contentObj.pos.y = contentObj.pos.y - 34;
  updateScrollbar();
});

onScroll((delta) => {
  if (imageLink) {
    if (zoomEffectTimer) clearTimeout(zoomEffectTimer);
    zoomEffect = 1;
    cameraScale *= delta.y < 0 ? zoomFactor : 1 / zoomFactor;
    //cameraScale = cameraScale * (1 - 0.6 * Math.sign(delta.y));
    camScale(cameraScale);
    zoomEffectTimer = setTimeout(() => {
      zoomEffect = 0;
    }, 250);
  } else {
    if (scrollbar.hidden) return;
    if (delta.y > 0 && contentObj.height + contentObj.pos.y < height() - 25) return;
    contentObj.pos.y = Math.min(0, contentObj.pos.y - delta.y / 3);
    updateScrollbar();
  }
});

// Handle cursor visibility
if (!imageLink) {
  loop(blinkSpeed / 1000, () => {
    if (contentObj.text.length < contentString.length) return;
    if (!hasCursor) {
      contentObj.text += cursorChar;
      hasCursor = true;
    } else {
      contentObj.text = contentObj.text.substring(0, contentObj.text.length - 1);
      hasCursor = false;
    }
  });
}

// Update the CRT post-processing effect
onUpdate(() => {
  const t = time();
  if (glitchTimer === 0.0) {
    glitchTimer = t + Math.random() * 10;
  }
  if (t > glitchTimer) {
    glitch = 1.0 - glitch;
    if (glitch === 0.0) {
      glitchTimer = t + Math.random() * 1;
    } else {
      glitchTimer = 0.0;
    }
  }

  if (!imageLink && slowType && !finishedTyping) {
    if (t > typeTimer) {
      const charactersToAdd = Math.ceil(Math.random() * 10) + 2; // Randomly add 1-5 characters each time
      for (let i = 0; i < charactersToAdd; i++) {
        if (contentObj.text.length - 1 >= contentString.length) {
          finishedTyping = true;
          break; // Prevent overflow
        }

        contentObj.text = contentObj.text.slice(0, -1); // Remove cursor

        // Check if we're at the last character
        if (contentObj.text.length === contentString.length - 1) {
          contentObj.text += contentString[contentObj.text.length]; // Add last character without cursor
        } else {
          contentObj.text += contentString[contentObj.text.length] + cursorChar; // Add next character and cursor
        }
      }
      // if (sound) sound.stop();
      // sound = play("click", {
      //   volume: 0.005,
      // });

      updateScrollbar();

      typeTimer = t + Math.random() * 0.03;
    }
  }

  if (imageLink) {
    if (isMouseDown("left") && isMouseMoved()) {
      const scaleWith = 1 / cameraScale;
      realPosition = realPosition.sub(mouseDeltaPos().scale(scaleWith));
      const adjustedSnapSize = snapSize * scaleWith;

      cameraPosition.x = Math.round(realPosition.x / adjustedSnapSize) * adjustedSnapSize;
      cameraPosition.y = Math.round(realPosition.y / adjustedSnapSize) * adjustedSnapSize;
      camPos(cameraPosition);
    }
  }

  usePostEffect("crt", {
    iTime: t,
    iResolution: vec2(width(), height()),
    flashGlitch: glitch,
    zoomEffect: zoomEffect,
  });

  setTimeout(updateScrollbar, 10);
});

function setColors(c) {
  const currentColor = c ?? urlParams.get("c") ?? "g";
  contentObj.color = new Color(...crtColors[currentColor].foreground);
  setBackground(crtColors[currentColor].background);
  tintColor = rgb(crtColors[currentColor].tint);
}

function updateScrollbar() {
  if (imageLink) return;
  const screenHeight = height(); // Height of the screen
  const contentHeight = contentObj.height; // Height of the text content
  scrollbar.hidden = contentHeight < screenHeight;

  // Calculate the proportional scrollbar height
  const scrollbarHeight = Math.min(screenHeight, screenHeight * (screenHeight / contentHeight));
  scrollbar.height = scrollbarHeight;

  // The amount the content has moved from its maximum "scrolled up" position
  const maxScrollDistance = contentHeight - screenHeight;
  const scrollProgress = -contentObj.pos.y / maxScrollDistance;

  // Calculate scrollbar position based on content scroll
  scrollbar.pos.y = scrollProgress * (screenHeight - scrollbarHeight);
}
