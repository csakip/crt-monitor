import kaplay from "kaplay";
import "kaplay/global";
import randomText from "./randomText.txt?raw";
import { openFullscreen } from "./utils";
// Use https://patorjk.com/software/taag to generate ASCII art

// Initialize the Kaplay game with a background color
let slowType = true;
const blinkSpeed = 530;
let hasCursor = false;
const cursorChar = "█";
let glitch = 1;
let glitchTimer = 0;
let typeTimer = 0;
// let sound;
let finishedTyping = false;

kaplay({ background: [0, 80, 0] });

openFullscreen();

loadFont("console", "/monofonto_rg.otf");

loadShaderURL("crt", null, "/shaders/crt.frag");

// loadSound("click", "/click.wav");

// Create a text object
const input = add([
  text(slowType ? "" : randomText, {
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

add([rect(20, height() - 50), pos(width() - 50, 25), color(0, 0, 0), opacity(0.5)]);

onKeyPress((ch) => {
  switch (ch) {
    case "escape": {
      if (slowType) {
        slowType = false;
        input.text = randomText;
      }
      break;
    }
  }
});
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

onKeyPressRepeat("up", () => {
  input.pos.y = Math.min(0, input.pos.y + 34);
});

onKeyPressRepeat("down", () => {
  input.pos.y = Math.min(0, input.pos.y - 34);
});

onScroll((delta) => {
  console.log(delta);
  input.pos.y = Math.min(0, input.pos.y - delta.y / 3);
});

// Handle cursor visibility
loop(blinkSpeed / 1000, () => {
  if (input.text.length < randomText.length) return;
  if (!hasCursor) {
    input.text += cursorChar;
    hasCursor = true;
  } else {
    input.text = input.text.substring(0, input.text.length - 1);
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
      const charactersToAdd = Math.ceil(Math.random() * 5); // Randomly add 1-5 characters each time
      for (let i = 0; i < charactersToAdd; i++) {
        if (input.text.length - 1 >= randomText.length) {
          finishedTyping = true;
          break; // Prevent overflow
        }

        input.text = input.text.slice(0, -1); // Remove cursor

        // Check if we're at the last character
        if (input.text.length === randomText.length - 1) {
          input.text += randomText[input.text.length]; // Add last character without cursor
        } else {
          input.text += randomText[input.text.length] + cursorChar; // Add next character and cursor
        }
      }
      // if (sound) sound.stop();
      // sound = play("click", {
      //   volume: 0.005,
      // });
      typeTimer = t + Math.random() * 0.03;
    }
  }

  usePostEffect("crt", {
    iTime: t,
    iResolution: vec2(width(), height()),
    flashGlitch: glitch,
  });
});
