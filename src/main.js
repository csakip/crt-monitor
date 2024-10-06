import kaplay from "kaplay";
import "kaplay/global";
import defaultText from "/src/defaultText.txt?raw";
// Use https://patorjk.com/software/taag to generate ASCII art

const urlParams = new URLSearchParams(window.location.search);
let content = urlParams.get("content") ?? defaultText;

document.getElementById("contentText").value = content;
generateLink();

document.getElementById("clearButton").addEventListener("click", () => {
  document.getElementById("contentText").value = defaultText;
  generateLink();
});

// Initialize the Kaplay game with a background color
let slowType = urlParams.get("slowtype") === "true";
const blinkSpeed = 530;
let hasCursor = false;
const cursorChar = "█";
let glitch = 1;
let glitchTimer = 0;
let typeTimer = 0;
// let sound;
let finishedTyping = false;

kaplay({ background: [0, 80, 0], loadingScreen: false, fullscreen: true });

loadFont("console", "/crt-monitor/monofonto_rg.otf");

loadShaderURL("crt", null, "/crt-monitor/shaders/crt.frag");

// loadSound("click", "/crt-monitor/click.wav");

// Create a text object
const crtText = add([
  text(slowType ? "" : content, {
    size: 30, // Initial text size
    width: width(), // Width of the text object
    align: "left", // Left alignment
    font: "console", // Font name
    letterSpacing: 3.5,
    lineSpacing: 3,
  }),
  pos(10, 10), // Position at the top-left corner
  color(0, 255, 51), // Set text color to green
]);

const scrollbar = add([rect(20, height()), pos(width() - 50, 25), color(0, 0, 0), opacity(0.5)]);
scrollbar.hidden = true;

onResize(() => {
  updateScrollbar();
  if (scrollbar.hidden && crtText.pos.y < 0) crtText.pos.y = 0;
});

onKeyPress((ch) => {
  switch (ch) {
    case "escape": {
      if (slowType) {
        slowType = false;
        crtText.text = content;
        updateScrollbar();
      }
      break;
    }
    case "r": {
      crtText.text = "";
      crtText.pos.y = 0;
      hasCursor = false;
      finishedTyping = false;
      slowType = true;
      updateScrollbar();
      break;
    }
    case "e": {
      const overlay = document.getElementById("overlay");
      console.log(overlay.style.display);
      overlay.classList.toggle("hidden");
      break;
    }
  }
});

onKeyPressRepeat("up", () => {
  crtText.pos.y = Math.min(0, crtText.pos.y + 34);
  updateScrollbar();
});

onKeyPressRepeat("down", () => {
  crtText.pos.y = crtText.pos.y - 34;
  updateScrollbar();
});

onScroll((delta) => {
  if (scrollbar.hidden) return;
  if (delta.y > 0 && crtText.height + crtText.pos.y < height() - 25) return;
  crtText.pos.y = Math.min(0, crtText.pos.y - delta.y / 3);
  updateScrollbar();
});

// Handle cursor visibility
loop(blinkSpeed / 1000, () => {
  if (crtText.text.length < content.length) return;
  if (!hasCursor) {
    crtText.text += cursorChar;
    hasCursor = true;
  } else {
    crtText.text = crtText.text.substring(0, crtText.text.length - 1);
    hasCursor = false;
  }
});

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

  if (slowType && !finishedTyping) {
    if (t > typeTimer) {
      const charactersToAdd = Math.ceil(Math.random() * 10) + 2; // Randomly add 1-5 characters each time
      for (let i = 0; i < charactersToAdd; i++) {
        if (crtText.text.length - 1 >= content.length) {
          finishedTyping = true;
          break; // Prevent overflow
        }

        crtText.text = crtText.text.slice(0, -1); // Remove cursor

        // Check if we're at the last character
        if (crtText.text.length === content.length - 1) {
          crtText.text += content[crtText.text.length]; // Add last character without cursor
        } else {
          crtText.text += content[crtText.text.length] + cursorChar; // Add next character and cursor
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

  usePostEffect("crt", {
    iTime: t,
    iResolution: vec2(width(), height()),
    flashGlitch: glitch,
  });
});

function updateScrollbar() {
  const screenHeight = height(); // Height of the screen
  const contentHeight = crtText.height; // Height of the text content
  scrollbar.hidden = contentHeight < screenHeight;

  // Calculate the proportional scrollbar height
  const scrollbarHeight = Math.min(screenHeight, screenHeight * (screenHeight / contentHeight));
  scrollbar.height = scrollbarHeight;

  // The amount the content has moved from its maximum "scrolled up" position
  const maxScrollDistance = contentHeight - screenHeight;
  const scrollProgress = -crtText.pos.y / maxScrollDistance;

  // Calculate scrollbar position based on content scroll
  scrollbar.pos.y = scrollProgress * (screenHeight - scrollbarHeight);
}

// // Handle character input
// onKeyPressRepeat((ch) => {
//   if (ch === "space") ch = " ";
//   if (ch.length > 1) return;
//   // Always make sure to remove the cursor character if it is the last character
//   if (hasCursor) {
//     input.text = input.text.substring(0, input.text.length - 1); // Remove the cursor before adding new char
//   }
//   const character = isKeyDown("shift") ? ch.toUpperCase() : ch;
//   input.text += character + cursorChar;
//   hasCursor = true;
// });

// Handle new line insertion on Enter key
// onKeyPressRepeat("enter", () => {
//   // Remove the cursor if it is the last character
//   if (hasCursor) {
//     input.text = input.text.substring(0, input.text.length - 1);
//   }
//   input.text += "\n" + cursorChar;
//   hasCursor = true;
// });

// Handle backspace to delete the last character
// onKeyPressRepeat("backspace", () => {
//   if (input.text.length > 0) {
//     input.text = input.text.substring(0, input.text.length - (hasCursor ? 2 : 1)); // Remove cursor if it's last
//     input.text += cursorChar;
//     hasCursor = true;
//   }
// });
