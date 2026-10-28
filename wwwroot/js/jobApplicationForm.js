'use strict';

// Entry point for the Job Application Form page.
// This file is loaded with <script type="module">, which is what allows the
// import statement below. Module scripts are deferred automatically, so the
// code runs only after the HTML has been parsed and every element exists.
import { DOMManipulator } from "./DOMManipulator.js";

// Static method: called on the class, no object needed.
// Open the browser's console (F12) to see the output.
DOMManipulator.demonstrateDOMSelectors();

// Instance methods need an object. Registering the listeners once is all
// the setup required; event delegation handles everything after that.
const dom = new DOMManipulator();
dom.setUpEventListeners();
