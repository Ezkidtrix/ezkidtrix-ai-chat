let url = "https://<url>.ezkidtrix.workers.dev/";
let [models, history] = [{
  "DeepSeek V3.1 Terminus": "deepseek-ai/deepseek-v3.1-terminus",
  "DeepSeek V3.1": "deepseek-ai/deepseek-v3.1",
  "DeepSeek R1": "deepseek-ai/deepseek-r1-0528",
  "Qwen3 235B": "qwen/qwen3-235b-a22b",    
  "Qwen3 Coder 480B": "qwen/qwen3-cxoder-480b-a35b-instruct",
  "Qwen3 Next 80B": "qwen/qwen3-next-80b-a3b-thinking",
  "Llama 4 Maverick": "meta/llama-4-maverick-17b-128e-instruct",
  "Llama 4 Scout": "meta/llama-4-scout-17b-16e-instruct",
  "Llama 3.1 405B": "meta/llama-3.1-405b-instruct",
  "Kimi K2 Instruct": "moonshotai/kimi-k2-instruct-0905",
  "GPT OSS 20B": "openai/gpt-oss-20b",
  "GPT OSS 120B": "openai/gpt-oss-120b"
}, []];

let icon = "", loading = false;
let currentModel = Object.values(models)[0];

let input, output;
let btns, [
  submitBtn, 
  clearBtn, 
  scrollBtn, 
  charCounter, 
  messageData
] = new Array(5).fill();

let mainContainer, header;
let inputContainer, inputWrapper, inputFieldWrapper;

let title, visible = true;
let tps = 0, tokenAlpha = 0.2;

let tokenTimes = [], tokenMs = 300;
let lastTokenAt = 0, decayRate = 3;

let startToken = 0, tokens = 0;
let responding = false, scrolled = false;

let [dtime, time] = [0, 0];
let dropdownToggled = false, stop = false;

let aiText = "";
let currReasoningText = "", currReasoningSpan;

let ready = false;
let colors = {
  tx: "#ECE8E8",
  bg: "#464646",
  h1: "#3A3A3A",
  br: "#353535",
  msg: "#3A3A3A",
  btn: "#FF0000",
  btn2: "#B60000",
  input: "#383838"
};

let pickedColor = colors.btn;
let currentHue = 0, currentSat = 100, currentVal = 100;

let md;
let focus = false;

function setup() {
  noCanvas();
  
  init();
  logLines();
}

function draw() {
  background(colors.bg);
  
  if (input && input.value().length > 0) {
    input.value(input.value().slice(0, 110000 - 1));
  }
  
  if (inputFieldWrapper && title) {
    if (history.length > 0) {
      inputFieldWrapper.style("bottom", "0px");
    } else {
      inputFieldWrapper.style("bottom", `${windowHeight / 2 - 100}px`);
    }
  }
  
  if (responding && !loading) {
    dtime += deltaTime;
    time = dtime / 1000;
    
    let dt = deltaTime / 1000;
    tps *= exp(-decayRate * dt);
    
    if (tps < 0.005) tps = 0;
    messageData.elt.innerText = `Tokens/s: ${tps.toFixed(2)}`;
  }
  
  if (icon === "" && submitBtn) {
    if (!responding) {
      icon = `<svg preserveAspectRatio="xMidYMin" fill="#ffffff" width="20px" height="20px" viewBox="0 0 24 16" data-name="Multi Color" xmlns="http://www.w3.org/2000/svg" class="icon multi-color"><path id="primary-stroke" d="M5,10l7-7,7,7M12,3V21" style="fill: none; stroke: rgb(255, 255, 255); stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path></svg>`;
    } else if (loading) {
      icon = `<svg fill="#ffffff" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25"/><path d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"><animateTransform attributeName="transform" type="rotate" dur="0.8s" values="0 12 12; 360 12 12" repeatCount="indefinite"/></path></svg>`;
    } else if (responding) {
      icon = `<svg preserveAspectRatio="xMidYMin" fill="#ffffff" width="18px" height="18px" viewBox="0 0 15 15" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M13,14H2c-0.5523,0-1-0.4477-1-1V2c0-0.5523,0.4477-1,1-1h11c0.5523,0,1,0.4477,1,1v11C14,13.5523,13.5523,14,13,14z"/></svg>`;
    }
    
    submitBtn.html(icon);
    submitBtn.style("background", colors.btn);
  }
}

async function init() {
  md = markdownit({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (str, lang) => {
      let codeBlock = document.createElement("div");
      codeBlock.className = "code-block";

      let header = document.createElement("div");
      header.className = "code-header";
      header.innerHTML = `
        <span class="code-language">${lang || "text"}</span>
        <button class="copy-btn" onclick="copyToClipboard(this)">Copy</button>
      `;

      let codeContent = document.createElement("pre");
      codeContent.className = "code-content";

      let codeEl = document.createElement("code");
      codeEl.setAttribute("allow", "clipboard-read; clipboard-write *");
      codeEl.className = lang ? `language-${lang}` : "";

      codeEl.textContent = str;
      codeContent.appendChild(codeEl);

      codeBlock.appendChild(header);
      codeBlock.appendChild(codeContent);


      if (window.hljs && lang) {
        try {
          hljs.highlightElement(codeEl);
        } catch (e) {
          if (window.Prism) {
            Prism.highlightElement(codeEl, true);
          }
        }
      } else if (window.Prism && lang) {
        Prism.highlightElement(codeEl, true);
      }

      return codeBlock.outerHTML;
    }
  });
  let { jsPDF } = await import("https://cdn.jsdelivr.net/npm/jspdf@2/dist/jspdf.umd.min.js");
  
  window.MathJax = {
    tex: {
      inlineMath: [["$", "$"], ["\\(", "\\)"]],
      displayMath: [["$$", "$$"], ["\\[", "\\]"], ["\\\\[", "\\\\]"]],
      processEscapes: true,
      processEnvironments: true
    },
    options: {
      skipHtmlTags: ["script", "noscript", "style", "textarea", "pre"]
    }
  };

  let mjScript = document.createElement("script");
  mjScript.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
  
  mjScript.async = true;
  mjScript.onload = () => {
    window.mathReady = true;
  };
  document.head.appendChild(mjScript);

  let mathStyles = createElement("style");
  mathStyles.html(`
    .MathJax_Display { overflow-x:auto; max-width:75% !important; display:inline-block !important; white-space:pre-wrap !important; word-break:break-word !important; }
    mjx-container { display:inline-block !important; max-width:75% !important; overflow-x:auto !important; }
    .mjx-chtml { white-space:normal !important; word-break:break-word !important; }
    .MJXc-display { display:inline !important; margin:0 !important; }
  `);
  
  document.head.appendChild(mathStyles.elt);
  elements();

  output.elt.addEventListener("scroll", () => {
    scrolled = !isAtBottom(output.elt);
    scrollBtn.style("opacity", !isAtBottom(output.elt, 100) ? "1" : "0");
  });

  handleDropdown();
  handleExportDropdown();
  
  if (focus) input.elt.focus();
}

function elements() {
  mainContainer = createDiv();
  mainContainer.style("position", "fixed");
  mainContainer.style("top", "0");
  mainContainer.style("left", "0");
  mainContainer.style("width", "100vw");
  mainContainer.style("height", "100vh");
  mainContainer.style("background", colors.bg)
  mainContainer.style("display", "flex");
  mainContainer.style("flex-direction", "column");

  header = createDiv();
  header.style("height", "60px");
  header.style("background", colors.h1)
  header.style("border-bottom", `1px solid ${colors.br}`);
  header.style("display", "flex");
  header.style("align-items", "center");
  header.style("justify-content", "left");
  header.style("padding", "0 10px");
  header.parent(mainContainer);
  header.child(document.querySelector(".dropdown-container"));

  let chatContainer = createDiv();
  chatContainer.style("flex", "1");
  chatContainer.style("display", "flex");
  chatContainer.style("justify-content", "center");
  chatContainer.style("overflow", "hidden");
  chatContainer.parent(mainContainer);

  output = createDiv();
  output.style("width", "100%");
  output.style("max-width", `${windowWidth}px`);
  output.style("height", "100%");
  output.style("overflow-y", "auto");
  output.style("padding", "20px");
  output.style("background", colors.bg)
  output.style("color", colors.tx);
  output.style("font-family", "system-ui, -apple-system, sans-serif");
  output.style("font-size", "14px");
  output.style("line-height", "1.6");
  output.parent(chatContainer);

  output.style("scrollbar-width", "thin");
  output.style("scrollbar-color", "rgb(40, 40, 40) transparent");

  inputContainer = createDiv();
  inputContainer.style("background", "transparent");
  inputContainer.style("padding", "10px");
  inputContainer.style("display", "flex");
  inputContainer.style("justify-content", "center");
  inputContainer.parent(mainContainer);

  inputWrapper = createDiv();
  inputWrapper.style("display", "flex");
  inputWrapper.style("gap", "12px");
  inputWrapper.style("align-items", "flex-end");
  inputWrapper.parent(inputContainer);

  inputFieldWrapper = createDiv();
  inputFieldWrapper.style("flex", "1");
  inputFieldWrapper.style("position", "relative");
  inputFieldWrapper.style("background", colors.input);
  inputFieldWrapper.style("border", "1px solid rgb(40, 40, 40)");
  inputFieldWrapper.style("border-radius", "12px");
  inputFieldWrapper.style("transition", "all 0.5s ease");
  inputFieldWrapper.style("height", "105px");
  inputFieldWrapper.style("box-shadow", "0 0 50px rgba(0, 0, 0, 0.6)");
  inputFieldWrapper.style("bottom", `${windowHeight / 2 - 100}px`);
  inputFieldWrapper.parent(inputWrapper);

  input = createElement("textarea");
  input.style("width", `${min(windowWidth - 100, 600)}px`);
  input.style("min-height", "30px");
  input.style("max-height", "30px");
  input.style("background", "transparent");
  input.style("border", "none");
  input.style("outline", "none");
  input.style("color", "rgb(220, 240, 220)");
  input.style("font-size", "14px");
  input.style("font-family", "system-ui, -apple-system, sans-serif");
  input.style("line-height", "1.5");
  input.style("padding", "10px");
  input.style("resize", "none");
  input.style("overflow-y", "auto");
  input.style("scrollbar-width", "thin");
  input.style("scrollbar-color", "rgb(40, 40, 40) transparent");
  input.attribute("maxlength", "110000");
  input.attribute("placeholder", "Type a message...");
  input.parent(inputFieldWrapper);

  input.elt.addEventListener("focus", () => {
    inputFieldWrapper.style("border-color", "rgb(20, 20, 20)");
  });
  input.elt.addEventListener("blur", () => {
    inputFieldWrapper.style("border-color", "rgb(80, 80, 80)");
  });
  
  charCounter = createSpan("0/110000")
    .style("position", "absolute")
    .style("right", "52px")
    .style("bottom", "15px")
    .style("color", "white")
    .style("font-size", "18px")
    .style("font-family", "system-ui, -apple-system, sans-serif")
    .parent(inputFieldWrapper);

  input.elt.addEventListener("input", () => {
    input.elt.style.height = "auto";
    input.elt.style.height = min(input.elt.clientHeight, 120) + "px";
    
    charCounter.elt.innerText = `${input.value().length}/110000`;
  });
  
  title = createSpan(`<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="50px" height="50px" viewBox="0 0 255 234" preserveAspectRatio="xMidYMid meet"><g transform="translate(0,234) scale(0.1,-0.1)" fill="
#ffffff" stroke="none"><path d="M693 1996c-134-44-195-137-195-296 1-210 123-465 355-738 109-129 255-262 287-262 31 0 60 27 60 56 0 12-58 79-147 170-194 196-313 365-388 549-59 144-68 271-25 342 34 56 63 68 165 68 92-1 179-22 267-66 21-11 46-19 56-19 28 0 54 34 50 67-2 22-14 34-53 55-133 72-335 106-432 74z"/><path d="M1700 1995c-227-48-525-236-756-476-129-135-146-166-106-202 36-33 56-21 213 136 170 168 285 255 451 342 233 121 423 126 481 12 37-72 21-220-38-354-14-31-25-66-25-79 0-31 26-54 61-54 27 0 33 6 64 73 54 112 78 223 73 331-3 67-10 102-25 131-28 53-88 110-138 131-53 22-175 27-255 9z"/><path d="M1438 1669c-11-6-18-22-18-40 0-25 22-51 134-162 162-160 275-311 356-472 93-187 119-334 74-420-33-63-72-80-179-79-80 0-101 4-185 38-52 21-106 40-120 43-34 6-62-17-62-51 0-38 24-58 117-94 119-47 208-65 291-59 88 6 130 24 188 77 68 63 89 128 83 255-6 120-29 201-99 340-102 204-293 447-461 587-58 48-86 57-119 37z"/><path d="M1282 1387c-6-7-16-35-23-62-18-75-24-82-94-105-49-16-65-26-65-40 0-22 20-35 70-44 52-9 77-31 84-73 17-94 26-113 51-113 25 0 34 19 51 113 7 44 28 61 97 78 79 19 74 57-11 79-62 15-78 31-93 93-19 84-40 107-67 74z"/><path d="M1622 981c-317-341-730-555-915-473-85 38-111 117-84 256 9 45 30 115 47 155 16 41 30 82 30 92 0 29-29 50-64 47-27-3-35-11-63-68-72-145-96-327-59-437 21-63 74-121 142-154 42-21 63-24 149-23 85 0 114 5 195 33 185 63 367 175 557 342 113 100 243 242 243 267 0 31-29 62-58 62-22 0-47-20-120-99z"/></g></svg>AI Chat`);
  title.size(250, 50);
  title.position(windowWidth / 2 - title.width / 2, windowHeight / 2 - 110);
  title.style("background", "transparent");
  title.style("border", "none");
  title.style("outline", "none");
  title.style("color", "rgb(220, 240, 220)");
  title.style("text-align", "center");
  title.style("font-weight", "bold");
  title.style("font-size", "20px");
  title.style("font-family", "system-ui, -apple-system, sans-serif");
  title.style("transition", "all 0.5s ease");
  title.style("pointer-events", "none");

  submitBtn = createButton("");
  submitBtn.style("background", colors.btn);
  submitBtn.style("color", colors.tx);
  submitBtn.style("border", "none");
  submitBtn.style("border-radius", "100px");
  submitBtn.style("padding", "5px");
  submitBtn.style("font-size", "18px");
  submitBtn.style("font-family", "system-ui, -apple-system, sans-serif");
  submitBtn.style("font-weight", "100");
  submitBtn.style("cursor", "pointer");
  submitBtn.style("transition", "all 0.2s ease");
  submitBtn.style("min-width", "40px");
  submitBtn.style("height", "40px");
  submitBtn.style("text-align", "center");
  submitBtn.style("position", "absolute");
  submitBtn.style("bottom", "5px");
  submitBtn.style("right", "5px");
  submitBtn.parent(inputFieldWrapper);
  submitBtn.mousePressed(reply);
  
  submitBtn.mouseOver(() => {
    submitBtn.style("background", colors.btn2);
  });
  submitBtn.mouseOut(() => {
    if (!responding) {
      submitBtn.style("background", colors.btn);
    }
  });
  
  clearBtn = createButton(`<svg width="20px" height="20px" viewBox="0 0 24 24" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
 <g transform="translate(0 -1028.4)"><path d="m5 1031.4c-2.2091 0-4 1.8-4 4v8c0 2.2 1.7909 4 4 4h0.1562v4.8l5.9058-4.8h7.938c2.209 0 4-1.8 4-4v-8c0-2.2-1.791-4-4-4h-14z" fill="rgb(0, 0, 0, 0)" stroke="#ffffff" stroke-width="2.5px" />
 </g></svg>`);
  clearBtn.style("background", colors.btn);
  clearBtn.style("color", colors.tx);
  clearBtn.style("border", "none");
  clearBtn.style("border-radius", "100px");
  clearBtn.style("padding", "5px");
  clearBtn.style("font-size", "18px");
  clearBtn.style("font-family", "system-ui, -apple-system, sans-serif");
  clearBtn.style("font-weight", "100");
  clearBtn.style("cursor", "pointer");
  clearBtn.style("transition", "all 0.2s ease");
  clearBtn.style("min-width", "40px");
  clearBtn.style("height", "40px");
  clearBtn.style("text-align", "center");
  clearBtn.style("position", "absolute");
  clearBtn.style("bottom", "5px");
  clearBtn.style("left", "5px");
  clearBtn.parent(inputFieldWrapper);
  clearBtn.mousePressed(() => {
    if (!responding && !loading) {
      history = [];
      output.html("");

      title.style("opacity", "1");
      scrollBtn.style("opacity", "0");
      
      responding = false;
      messageData.elt.innerText = "Tokens/s: 0.00";
    }
    
    input.elt.focus();
  });
  
  messageData = createSpan("Tokens/s: 0.00");
  messageData.style("background", colors.btn);
  messageData.style("color", colors.tx);
  messageData.style("border", "none");
  messageData.style("border-radius", "100px");
  messageData.style("padding", "5px");
  messageData.style("font-size", "18px");
  messageData.style("font-family", "system-ui, -apple-system, sans-serif");
  messageData.style("font-weight", "100");
  messageData.style("transition", "all 0.2s ease");
  messageData.style("width", "150px");
  messageData.style("height", "25px");
  messageData.style("text-align", "center");
  messageData.style("position", "absolute");
  messageData.style("bottom", "7.5px");
  messageData.style("left", "50px");
  messageData.parent(inputFieldWrapper);
  
  scrollBtn = createButton(`<svg fill="#fff" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g data-name="Layer 2"><g data-name="arrow-ios-downward"><rect width="24" height="24" opacity="0"/><path d="M12 16a1 1 0 0 1-.64-.23l-6-5a1 1 0 1 1 1.28-1.54L12 13.71l5.36-4.32a1 1 0 0 1 1.41.15 1 1 0 0 1-.14 1.46l-6 4.83A1 1 0 0 1 12 16z"/></g></g></svg>`);
  scrollBtn.style("background", colors.btn);
  scrollBtn.style("color", colors.tx);
  scrollBtn.style("border", "none");
  scrollBtn.style("border-radius", "100px");
  scrollBtn.style("padding", "5px");
  scrollBtn.style("font-size", "18px");
  scrollBtn.style("font-family", "system-ui, -apple-system, sans-serif");
  scrollBtn.style("font-weight", "100");
  scrollBtn.style("cursor", "pointer");
  scrollBtn.style("transition", "all 0.2s ease");
  scrollBtn.style("min-width", "40px");
  scrollBtn.style("height", "40px");
  scrollBtn.style("text-align", "center");
  scrollBtn.style("position", "absolute");
  scrollBtn.style("bottom", "110px");
  scrollBtn.style("right", "5px");
  scrollBtn.style("opacity", "0");
  scrollBtn.style("transition", "opacity 0.5s");
  scrollBtn.parent(inputFieldWrapper);
  
  scrollBtn.mousePressed(() => {
    output.elt.scrollTo({
      top: output.elt.scrollHeight * 2,
      behavior: "instant",
    });
    
    input.elt.focus();
  });
  
  let selectorHTML = document.querySelectorAll(".dropdown-menu");
  let triggerHTML = document.querySelectorAll(".dropdown-trigger");
  let dropdowns = [];
  
  selectorHTML.forEach(e => dropdowns.push(new p5.Element(e)));
  triggerHTML.forEach(e => dropdowns.push(new p5.Element(e)));
  
  dropdowns.splice(1, 1);
  btns = [
    submitBtn, 
    clearBtn, 
    scrollBtn,
    messageData,
  ];
  
  for (let d of dropdowns) {
    btns.push(d);
  }
  
  handleColorPicker();
  setupColorPicker();
}

function handleDropdown() {
  let dropdownToggle = document.querySelector("#model-selector");
  
  let dropdownText = document.querySelector(".dropdown-text");
  let dropdownOptions = document.querySelectorAll(".model-option");

  dropdownOptions.forEach(option => {
    if (option.disabled) return;
    
    option.addEventListener("click", e => {
      e.preventDefault();

      let selectedModel = option.textContent;
      dropdownText.textContent = selectedModel;

      currentModel = models[selectedModel];
      dropdownToggle.checked = false;
    });
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".dropdown-container")) {
      dropdownToggle.checked = false;
    }
  });  
}

function handleExportDropdown() {
  let exportToggle = document.querySelector("#export-selector");
  let exportText = document.querySelector(".export-trigger .dropdown-text");
  let exportOptions = document.querySelectorAll(".export-option");
  
  exportOptions.forEach(opt => {
    opt.addEventListener("click", e => {
      e.preventDefault();
      
      exportToggle.checked = false;
      exportChat(opt.dataset.format);
    });
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".export-dropdown-container")) {
      exportToggle.checked = false;
    }
  });
}

function exportChat(format) {
  if (history.length > 0) {
    switch (format) {
      case "PDF":
        break;
      case "TXT":
        let chat = "";
        
        for (let msg of history) {
          chat += msg.content + "\n";
        }
        
        save(chat, "chat.txt");
        break;
    }
  }
}

function handleColorPicker() {
  let pickerToggle = document.getElementById("color-picker-selector");

  document.addEventListener("click", e => {
    if (!e.target.closest(".color-picker-container")) {
      pickerToggle.checked = false;
    }
  });
}

function setupColorPicker() {
  preview = document.querySelector(".preview");
  svPicker = document.querySelector(".sv-picker");
  
  svGradient = document.querySelector(".sv-gradient");
  svSelector = document.querySelector(".sv-selector");
  huePicker = document.querySelector(".hue-picker");
  
  hueGradient = document.querySelector(".hue-gradient");
  hueSelector = document.querySelector(".hue-selector");

  updateSVSelector(200, 0);
  updateHueSelector(0);
  
  updateSVGradient();
  updatePreview();

  let draggingSV = false;
  let draggingHue = false;

  svPicker.addEventListener("mousedown", (e) => {
    draggingSV = true;
    updateSVFromMouse(e);
  });

  huePicker.addEventListener("mousedown", (e) => {
    draggingHue = true;
    updateHueFromMouse(e);
  });

  document.addEventListener("mousemove", (e) => {
    if (draggingSV) updateSVFromMouse(e);
    if (draggingHue) updateHueFromMouse(e);
  });

  document.addEventListener("mouseup", () => {
    draggingSV = false;
    draggingHue = false;
  });
}

function updateSVFromMouse(e) {
  let rect = svPicker.getBoundingClientRect();
  
  let x = constrain(e.clientX - rect.left, 0, rect.width);
  let y = constrain(e.clientY - rect.top, 0, rect.height);
  
  updateSVSelector(x, y);
  currentSat = x;
  
  currentVal = 100 - (y / 200) * 100;
  updatePreview();
}

function updateHueFromMouse(e) {
  let rect = huePicker.getBoundingClientRect();
  let y = constrain(e.clientY - rect.top, 0, rect.height);
  
  updateHueSelector(y);
  currentHue = (y / 200) * 360;
  
  updateSVGradient();
  updatePreview();
}

function updateSVSelector(x, y) {
  svSelector.style.left = `${x}px`;
  svSelector.style.top = `${y}px`;
}

function updateHueSelector(y) {
  hueSelector.style.top = `${y}px`;
}

function updateSVGradient() {
  let color = `hsl(${currentHue}, 100%, 50%)`;
  svGradient.style.background = `
    linear-gradient(to top, #000 0%, transparent 100%),
    linear-gradient(to right, #fff 0%, ${color} 100%)
  `;
}

function updatePreview() {
  let rgb = hsvToRgb(currentHue / 360, currentSat / 100, currentVal / 100);
  let hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  
  if (hex !== pickedColor) {
    pickedColor = hex;
    
    colors.btn = pickedColor;
    colors.btn2 = rgbToHex(rgb.r - 75, rgb.g, rgb.b);
    
    for (let b of btns) {
      if (b) b.style("background", colors.btn);
    }
    
    let copyBtn = document.querySelector(".copy-msg");
    if (copyBtn) new p5.Element(copyBtn).style("background", colors.btn);
  }
  
  preview.style.background = pickedColor;
}

function hsvToRgb(h, s, v) {
  let r, g, b;
  let i = floor(h * 6);
  
  let f = h * 6 - i;
  let p = v * (1 - s);
  
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);
  
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  
  return { r: round(r * 255), g: round(g * 255), b: round(b * 255) };
}

function rgbToHex(r, g, b) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

async function keyPressed() {
  if (
    key === "Enter" && !responding && !loading &&
    (!keyIsDown("Shift") && !keyIsDown("Command"))
  ) {
    reply();
  }
}

async function reply() {
  let tx = input.value();
  
  currReasoningText = "";
  currReasoningSpan = null;
  
  if (!responding && tx !== "") {
    shift = false;
    responding = true;
    
    [dtime, time] = [0, 0];
    addMessage(tx, true);
    
    getResponse(tx);
    await delay();
    
    input.value("");
    input.elt.focus();
  } else {
    if (responding) stop = true;
  }
  
  await new Promise(r => setTimeout(r, 10));
  charCounter.elt.innerText = `0/110000`;
}

async function getResponse(query) {
  time = 0;
  tokens = 0;
  
  if (currentModel !== "") {
    stop = false;
    
    title.style("opacity", "0");
    history.push({ role: "user", content: query });
    
    loading = true;
    icon = "";
    
    scrolled = false;
    responding = true;

    output.elt.scrollTo({
      top: output.elt.scrollHeight * 10,
      behavior: "instant",
    });
    
    document.querySelectorAll(".copy-msg").forEach(e => {
      e.remove();
    });

    let thinkSpan, mainText = "", reasonText = "";
    let messageSpan = await addMessage("", false, false);
    
    let isSearching = await shouldSearch(query);
    if (isSearching) {
      let results = await searchResponse(query, messageSpan);
      let baseQuery = query.toString();
      query = `Summarize the web results below concisely and accurately to answer the user's true question (ignore phrases like "search the web"), using only provided info and citing sources when possible: User Message: ${baseQuery} | Web Results: ${results}`;
    }

    thinkSpan = createSpan("")
      .style("display", "block")
      .style("border-left", "5px solid rgb(20, 20, 20)")
      .style("border-radius", "3px")
      .style("padding", "8px")
      .style("margin", "5px 0")
      .style("font-style", "italic")
      .style("color", "rgba(200, 220, 200, 0.9)");
    thinkSpan.style("display", "none");
    thinkSpan.parent(messageSpan);

    try {
      output.elt.scrollTo({
        top: output.elt.scrollHeight * 10,
        behavior: "instant",
      });
      
      let res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: currentModel,
          temperature: 0.7,
          top_p: 0.9,
          messages: [
            { "role": "system", "content": "You are an AI chatbot. You are designed to answer whatever the user requests in English, unless another language is specified or requested in past or current messages." },
            ...history
          ],
          stream: true,
          max_tokens: 16384,
          chat_template_kwargs: {
            thinking: true
          }
        })
      });
      
      loading = false;
      icon = "";
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      startToken = performance.now();
      
      let reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";

      aiText = "";
      while (true) {
        if (stop) {
          stop = false;
          responding = false;
          
          icon = "";
          break;
        }

        let { done, value } = await reader.read();
        if (done) break;

        buffer += value;
        let parts = buffer.split("\n");

        buffer = parts.pop() || "";

        for (let ln of parts) {
          if (!ln.startsWith("data: ")) continue;

          let json = ln.slice(6).trim();
          if (!json || json === "[DONE]") continue;

          try {
            updateTPS();
            
            let { choices } = JSON.parse(json);
            let delta = choices[0]?.delta;
            
            let type = delta?.content ? 
                "normal" : delta?.reasoning_content ? 
                "reason" : null;
            let token = delta?.content || 
              delta?.reasoning_content || null;
            
            if (type === "reason") {
              reasonText += token;
              thinkSpan.style("display", "block");
              
              await updateMessageDisplay(thinkSpan, token, false);
              await formatTextStreaming(reasonText, thinkSpan.elt);
            } else if (type === "normal") {
              mainText += token;
              aiText += token;
              
              await updateMessageDisplay(messageSpan, token, false);
              await formatTextStreaming(mainText, messageSpan.elt);
              
              if (thinkSpan) {
                messageSpan.elt.prepend(thinkSpan.elt);
              }
            }
            
            maintainScrollPosition();
            await delay();
          } catch (err) {
            loading = false;
            icon = "";
            
            console.error("Error:", err);
          }

          buffer = parts[parts.length - 1];
        }
      }
    } catch (err) {
      loading = false;
      icon = "";
      
      console.error(err);
    }

    formatMath(messageSpan.elt);
    history.push({ role: "assistant", content: mainText });
  }
  
  input.elt.focus();
  
  responding = false;
  icon = "";
  
  tps = 0;
  tokenTimes = [];
  
  maintainScrollPosition();
}

function updateTPS() {
  let now = performance.now();
  tokens++;
  
  lastTokenAt = now;
  tokenTimes.push(now);
  
  let cutoff = now - tokenMs;
  while (tokenTimes.length && tokenTimes[0] < cutoff) tokenTimes.shift();
  
  let currTps = tokenTimes.length / (tokenMs / 1000);
  tps = tps ? (tps * (1 - tokenAlpha) + currTps * tokenAlpha) : currTps;
}

async function updateMessageDisplay(span, token, isFinal) {
  let lastChild = span.elt;
  span.elt.innerHTML += token || "";
  
  if (isFinal) {
    lastChild.innerHTML = lastChild.innerHTML
      .replace(/<think>.*<\/think>/gs, "")
      .replace("<｜end▁of▁sentence｜>", "");
    await formatMath(lastChild);
    
    if (ready) {
      await formatMath(lastChild);
      maintainScrollPosition();
    }
  } else {
    lastChild.innerHTML = lastChild.innerHTML
      .replace(/<think>.*<\/think>/gs, "")
      .replace("<｜end▁of▁sentence｜>", "");
  }
}

async function formatTextStreaming(text, container) {
  try {
    let mathBlocks = [];
    let mathCounter = 0;
    
    let processedText = text
      .replace(/\\\[([\s\S]*?)\\\]/g, (match, content) => {
        let placeholder = `MATHBLOCK${mathCounter++}ENDMATH`;
        mathBlocks.push(`\\[${content}\\]`);
        return placeholder;
      })
      .replace(/\\\(([\s\S]*?)\\\)/g, (match, content) => {
        let placeholder = `MATHBLOCK${mathCounter++}ENDMATH`;
        mathBlocks.push(`\\(${content}\\)`);
        return placeholder;
      })
      .replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
        let placeholder = `MATHBLOCK${mathCounter++}ENDMATH`;
        mathBlocks.push(`$$${content}$$`);
        return placeholder;
      })
      .replace(/(?<!\\)\$(?!\$)([\s\S]*?)(?<!\\)\$(?!\$)/g, (match, content) => {
        let placeholder = `MATHBLOCK${mathCounter++}ENDMATH`;
        mathBlocks.push(`$${content}$`);
        return placeholder;
      });

    let htmlContent = md.render(processedText);
    mathBlocks.forEach((mathBlock, i) => {
      htmlContent = htmlContent.replace(`MATHBLOCK${i}ENDMATH`, mathBlock);
    });

    let tempContainer = document.createElement("div");
    tempContainer.innerHTML = htmlContent;

    function processTextNodes(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        let children = Array.from(node.childNodes);
        children.forEach((child) => processTextNodes(child));
      }
    }

    processTextNodes(tempContainer);
    container.innerHTML = tempContainer.innerHTML;
    
    window.copyToClipboard = copyToClipboard;
  } catch (error) {
    console.warn("Streaming format error:", error);
    container.innerHTML = text
      .replace(/\n/g, "<br>")
      .replace(/\\n/g, "<br>")
      .replace("<｜end▁of▁sentence｜>", "");
  }
}

function copyToClipboard(button) {
  let text = document.querySelector(".code-content").textContent;

  navigator.clipboard.writeText(text).catch(() => {
    let textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";

    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Fallback: copy command failed", err);
    }

    document.body.removeChild(textarea);
  });
}

async function formatMath(el) {
  await new Promise(r => setTimeout(r, 10));
  if (!window.MathJax) return;
  
  try {
    if (el) await MathJax.typesetPromise([el]);
    else await MathJax.typesetPromise();
  } catch (e) {
    console.warn("MathJax typeset error:", e);
  }
}

async function shouldSearch(query) {
  try {
    let res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-ai/deepseek-v3.1-terminus",
        messages: [
          { "role": "system", "content": `
            You are a search decision agent. Analyze the user's query and conversation history, then respond with ONLY "true" or "false".

            Respond "true" if the query needs:
            - Recent events, news, or current information
            - Real-time data (weather, stocks, scores, etc.)
            - Facts that may have changed recently
            - Explicit search request from user

            Respond "false" if the query involves:
            - General knowledge or established facts
            - Casual conversation or creative requests
            - Coding, math, or explanations of stable topics
            - Information already present in conversation history

            The conversation history will be provided in the messages array. Base your decision on the full context.
        ` },
          ...history,
          { "role": "user", "content": "User Request:\n" + query }
        ],
        stream: false,
        max_tokens: 1,
        chat_template_kwargs: {
          thinking: false
        }
      })
    });
    if (res.status !== 200) throw new Error("AI Web Search failed!");
    
    let content = (await res.json())?.choices[0]?.message?.content;
    return content === "true" ? true : false;
  } catch (err) {
    console.error(err);
  }
}

async function searchResponse(query, span) {
  queries = (await getQueries(query))?.queries;
  if (queries.length === 0) return;
  
  scrolled = false;
  responding = true;
  
  let urlSpan, webResults = "";
  let searchDiv = createDiv(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(90 12 12)" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12h20" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="search-text"> Searching the Web...</span>`)
    .style("background", "rgb(50, 50, 50)")
    .style("border-radius", "10px")
    .style("font-size", "16px")
    .style("padding", "10px")
    .parent(span);
  
  output.elt.scrollTo({
    top: output.elt.scrollHeight * 2,
    behavior: "instant",
  });

  for (let q of queries.slice(0, 4)) {
    urlSpan = createSpan("<br>" + q)
      .style("font-style", "italic")
      .style("padding", "5px")
      .parent(searchDiv)
    
    output.elt.scrollTo({
      top: output.elt.scrollHeight * 2,
      behavior: "instant",
    });
    let results = JSON.parse(await webSearch(q)).organic;
    
    if (results) {
      let items = results.slice(0, 25);

      for (let item of items) {
        let content = await webSearch(item.link);
        
        webResults += `---START-RESULT--\n${content.substring(0, 320)}\nURL: ${item.link}\n---END-RESULT---\n\n`;
      }
      
      searchDiv.remove(urlSpan);
      searchDiv.remove();
      
      return webResults;
    }
  }
}

async function webSearch(tx) {
  let url = "https://<url>.ezkidtrix.workers.dev/?";
  let res = await fetch(`${url}${tx.startsWith("https://") ? "url" : "q"}=${tx}`);
  
  let results = await res.text();
  return results;
}

async function getQueries(query) {
  try {
    let res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-ai/deepseek-v3.1-terminus",
        messages: [
          { "role": "system", "content": `Generate 1–5 relevant web search queries without any additional formatting other than this JSON form {"queries":["...", ...]} based on the user's request and prior context to improve result accuracy and clarity. User's Question: ${query}` },
          ...history,
        ],
        stream: false,
        max_tokens: 100,
        temperature: 0.7,
        chat_template_kwargs: {
          thinking: false
        }
      })
    });
    if (res.status !== 200) throw new Error("AI Web Search failed!");
    
    let content = (await res.json()).choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch (err) {
      responding = false;
      loading = false;
      
      icon = "";
      console.error(err);
    }
  } catch (err) {
    console.error(err);
  }
}

async function addMessage(tx, user, animate = false) {
  let messageContainer = createDiv();
  messageContainer.class("message-container");
  messageContainer.style("display", "flex");
  messageContainer.style("margin", "16px 0");
  messageContainer.style("padding", "0 8px");
  
  if (user) {
    messageContainer.style("justify-content", "flex-end");
  } else {
    messageContainer.style("justify-content", "flex-start");
  }

  let messageBubble = createDiv();
  messageBubble.class("message-bubble");
  messageBubble.style("max-width", "75%");
  messageBubble.style("padding", "12px 16px");
  messageBubble.style("border-radius", "16px");
  messageBubble.style("font-size", "14px");
  messageBubble.style("line-height", "1.5");
  messageBubble.style("word-wrap", "break-word");
  messageBubble.style("word-break", "break-word");
  
  if (user) {
    messageBubble.style("background", "rgb(50, 50, 50)");
    messageBubble.style("color", "white");
    messageBubble.style("border-bottom-right-radius", "4px");
  } else {
    messageBubble.style("background", "rgb(30, 30, 30)");
    messageBubble.style("color", "rgb(220, 240, 220)");
    messageBubble.style("border", "1px solid rgb(20, 20, 20)");
    messageBubble.style("border-bottom-left-radius", "4px");
  }
  
  messageBubble.parent(messageContainer);
  messageContainer.parent(output);
  
  if (!user) {
    messageContainer.style("flex-direction", "column");
    messageContainer.style("align-items", "flex-start");
    
    let copyBtn = createButton("Copy");
    copyBtn.class("copy-msg");
    copyBtn.style("background", colors.btn);
    copyBtn.style("color", colors.tx);
    copyBtn.style("border", "none");
    copyBtn.style("border-radius", "8px");
    copyBtn.style("margin", "3px 3px")
    copyBtn.style("font-size", "15px");
    copyBtn.style("font-family", "system-ui, -apple-system, sans-serif");
    copyBtn.style("font-weight", "100");
    copyBtn.style("cursor", "pointer");
    copyBtn.style("transition", "all 0.2s ease");
    copyBtn.style("width", "50px");
    copyBtn.style("height", "25px");
    copyBtn.style("text-align", "center");
    copyBtn.style("position", "relative");
    copyBtn.style("align-self", "flex-start");
    copyBtn.style("margin-top", "3px");
    copyBtn.parent(messageContainer);
    
    copyBtn.mousePressed(() => {
      navigator.clipboard.writeText(
        aiText || 0
      ).catch(() => {
        let ta = document.createElement("textarea");
        
        ta.value = aiText || 0;
        ta.style.position = "fixed";
        
        document.body.appendChild(ta);
        ta.select();
        
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
      });
    });
  }

  if (tx) {
    await updateMessageDisplay(messageBubble, tx.replace(/\n/g, "<br>"), true);
  }

  return messageBubble;
}

function getTime() {
  return `${zero(floor(time / 60))}:${zero(floor(time % 60))}`;
}

function zero(x) {
  if (x > 9) return x;
  else return "0" + x;
}

function isAtBottom(e, t = 15) {
  return e.scrollHeight - e.scrollTop - e.clientHeight <= t;
}

function maintainScrollPosition() {
  if (!scrolled || isAtBottom(output.elt)) {
    output.elt.scrollTo({
      top: output.elt.scrollHeight * 2,
      behavior: "instant"
    });
  }
}

async function logLines() {
  let len = 0;
  let names = [
    "sketch.js"
  ];
  
  for (let name of names) {
    try {
      let res = await fetch(name);
      if (res.status !== 200) break;
      
      let codeText = await res.text();
      len += (codeText.match(/^.*$/gm) || []).length;
    } catch (error) {
      console.error(`Fetch Error:`, error);
    }
  }
  
  console.log(`Code Lines: ${len}`);
}

let workerCode = `
onmessage = (e) => {
  let { id, ms = 0, fb = 1e-10 } = e.data;
  let d = Math.max(0, ms);

  if (d > fb + 1) {
    setTimeout(() => {
      let t = performance.now() + Math.min(fb, d);
      while (performance.now() < t) {}

      postMessage({ id });
    }, Math.max(0, d - fb));
  } else {
    let t = performance.now() + d;

    while (performance.now() < t) {}
    postMessage({ id });
  }
};
`;

let worker = new Worker(
  URL.createObjectURL(new Blob([workerCode], { type: "application/javascript" }))
);

let pending = {};
let nextId = 1;

worker.onmessage = (e) => {
  let fn = pending[e.data.id];
  
  if (fn) {
    fn();
    delete pending[e.data.id];
  }
};

function delay(ms, finalBusy = 1e-10) {
  return new Promise((resolve) => {
    let id = nextId++;
    
    pending[id] = resolve;
    worker.postMessage({ id, ms, fb: finalBusy });
  });
}

function destroyDelayWorker() {
  worker.terminate();
}