/**
 * DOMManipulator
 * ----------------------------------------------------------------------------
 * Companion code for the CSCI 3110 "DOM Manipulation" lecture notes.
 *
 * This class drives the Job Application Form view
 * (Views/Home/JobApplicationForm.cshtml) and demonstrates:
 *   1. Selecting elements        - querySelector() / querySelectorAll()
 *   2. Event delegation          - one listener on document handles every button
 *   3. Adding elements           - three techniques:
 *        METHOD 1: document.createElement()  (addSkillField)
 *        METHOD 2: element.innerHTML         (used only for static, trusted text)
 *        METHOD 3: DOMParser                 (addReferenceField)
 *   4. Removing elements         - closest() + remove()
 *   5. Reading form data         - FormData (displaySummary)
 */
export class DOMManipulator {
    // Private fields (the # prefix) can only be accessed inside this class.
    // Each counter only ever increases, so every new field gets a unique id
    // and name even after other fields have been removed.
    #skillCount = 0;
    #referenceCount = 0;

    /**
     * Logs a few selector examples to the browser console (F12 > Console).
     * It is static because it does not use any instance data, so we call it
     * on the class itself: DOMManipulator.demonstrateDOMSelectors().
     */
    static demonstrateDOMSelectors() {
        console.log('=== DOM SELECTOR EXAMPLES ===');

        // Select by ID: '#' means "id". querySelector() returns the FIRST
        // matching element, or null if nothing matches.
        const form = document.querySelector('#jobApplicationForm');
        console.log('Form element:', form);

        // Select by tag name: querySelectorAll() returns a static NodeList of
        // EVERY match. It is never null; if nothing matches, length is 0.
        const allInputs = document.querySelectorAll('input');
        console.log('All input elements:', allInputs);

        // Select descendant elements: every <h2> that is inside an element
        // with class="form-section". Any CSS selector works here.
        const formSections = document.querySelectorAll('.form-section h2');
        console.log('Form section headers:', formSections);
    }

    /**
     * Registers the page's event listeners using EVENT DELEGATION.
     *
     * Instead of attaching a listener to each button, we attach ONE listener
     * to the document. Click events "bubble" up from the element that was
     * clicked (e.target) through all of its ancestors to the document, so
     * this one listener sees every click on the page, including clicks on
     * Remove buttons that did not exist when this method ran.
     */
    setUpEventListeners() {
        // An arrow function is used so that "this" still refers to the
        // DOMManipulator object inside the listener. With a regular function,
        // "this" would be the document and this.addSkillField() would fail.
        document.addEventListener('click', (e) => {
            // e.target is the element that was actually clicked.

            // Handle "Add Skill" button click
            if (e.target.getAttribute('id') === 'addSkillBtn') {
                this.addSkillField();
            }

            // Handle "Add Reference" button click
            if (e.target.getAttribute('id') === 'addReferenceBtn') {
                this.addReferenceField();
            }

            // Handle "Remove" button clicks for skills. These buttons are
            // created dynamically, which is why delegation is needed. We match
            // on a class because many of them can exist at once (ids must be
            // unique).
            if (e.target.classList.contains('remove-skill')) {
                this.removeSkillField(e.target);
            }

            // Handle "Remove" button clicks for references
            if (e.target.classList.contains('remove-reference')) {
                this.removeReferenceField(e.target);
            }
        });

        // The submit event fires on the <form>, not on the submit button.
        document.addEventListener('submit', (e) => {
            if (e.target.getAttribute('id') === 'jobApplicationForm') {
                // Stop the browser's default behavior (sending the form to
                // the server and reloading the page) so we can handle it here.
                e.preventDefault();
                this.displaySummary();
            }
        });
    }

    /**
     * METHOD 1: document.createElement()
     * Builds a new skill field one element at a time and appends it to
     * #skillsContainer. This is the safest technique because nothing is ever
     * parsed as HTML. Resulting markup:
     *
     *   <div class="skill-item" data-skill-id="1">
     *       <label for="skill1">Skill 1:</label>
     *       <input type="text" id="skill1" name="skill1" placeholder="...">
     *       <button class="remove-btn remove-skill" type="button">Remove</button>
     *   </div>
     */
    addSkillField() {
        this.#skillCount++;

        // Select the container where we'll add the new skill field
        const skillsContainer = document.querySelector('#skillsContainer');

        // Create the wrapper <div>. createElement() only creates the element
        // in memory; it is not visible until it is appended to the page.
        const skillDiv = document.createElement('div');
        skillDiv.className = 'skill-item';
        // data-* attributes let you store your own data on an element.
        skillDiv.setAttribute('data-skill-id', this.#skillCount);

        // Create label. The label's "for" must match the input's id so that
        // clicking the label focuses the input (and screen readers pair them).
        const label = document.createElement('label');
        label.setAttribute('for', `skill${this.#skillCount}`);
        label.textContent = `Skill ${this.#skillCount}:`;

        // Create input. The "name" attribute is the key FormData uses later
        // in displaySummary(), e.g. skill1, skill2, ...
        const input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.setAttribute('id', `skill${this.#skillCount}`);
        input.setAttribute('name', `skill${this.#skillCount}`);
        input.setAttribute('placeholder', 'e.g., JavaScript, Project Management');

        // Create remove button. type="button" is important: a <button> inside
        // a <form> defaults to type="submit" and would submit the form.
        // The "remove-skill" class is what setUpEventListeners() looks for.
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn remove-skill';
        removeBtn.textContent = 'Remove';
        removeBtn.setAttribute('type', 'button');

        // Append elements to the skill div (still only in memory)
        skillDiv.appendChild(label);
        skillDiv.appendChild(input);
        skillDiv.appendChild(removeBtn);

        // Add the complete skill div to the container. This single append
        // is the moment the new field appears on the page.
        skillsContainer.appendChild(skillDiv);

        // Put the cursor in the new field so the user can start typing.
        input.focus();
    }

    /**
     * METHOD 3: DOMParser
     * Writes the new reference block as an HTML string, parses it into a
     * separate document, then moves the resulting element into the page.
     * This is convenient for larger structures that would take many
     * createElement() calls.
     *
     * Only values WE control (the counter) are placed in the string. Never
     * insert user input into an HTML string; use textContent for that.
     */
    addReferenceField() {
        this.#referenceCount++;
        const id = this.#referenceCount;

        // Select the container
        const referencesContainer = document.querySelector('#referencesContainer');

        // A template literal (backticks) lets the string span several lines
        // and insert values with ${...}.
        const htmlString = `
            <div class="reference-item" data-reference-id="${id}">
                <div class="form-group">
                    <label for="refName${id}">Reference ${id} - Name:</label>
                    <input type="text" id="refName${id}" name="refName${id}"
                           placeholder="Reference full name">
                </div>
                <div class="form-group">
                    <label for="refEmail${id}">Email:</label>
                    <input type="email" id="refEmail${id}" name="refEmail${id}"
                           placeholder="reference@email.com">
                </div>
                <div class="form-group">
                    <label for="refRelationship${id}">Relationship:</label>
                    <select id="refRelationship${id}" name="refRelationship${id}">
                        <option value="">Select relationship</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="colleague">Colleague</option>
                        <option value="mentor">Mentor</option>
                        <option value="professor">Professor</option>
                    </select>
                </div>
                <button type="button" class="remove-btn remove-reference">Remove Reference</button>
            </div>`;

        // parseFromString() returns a complete, separate Document object
        // (with its own <html>, <head>, and <body>). Scripts in it do not run.
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        // Select the element we want from the parsed document. We can use
        // querySelector() on it just like on the page's document.
        const referenceDiv = doc.querySelector('.reference-item');

        // Appending moves the element from the parsed document into ours.
        referencesContainer.appendChild(referenceDiv);
    }

    /**
     * Removes the skill field that contains the clicked Remove button.
     * @param {HTMLElement} button - the Remove button that was clicked
     */
    removeSkillField(button) {
        // Traverse UP the DOM: closest() checks the element itself, then each
        // ancestor, and returns the first one matching the selector (or null).
        const skillItem = button.closest('.skill-item');
        if (skillItem) {
            // remove() takes the element, and everything inside it, out of
            // the DOM. Its inputs disappear from FormData automatically.
            skillItem.remove();
        }
        // Note: the remaining labels are not renumbered, so after removing
        // "Skill 2" the page shows Skill 1 and Skill 3. That is expected.
    }

    /**
     * Removes the reference block that contains the clicked Remove button.
     * @param {HTMLElement} button - the Remove Reference button that was clicked
     */
    removeReferenceField(button) {
        // Find the parent reference-item div
        const referenceItem = button.closest('.reference-item');
        if (referenceItem) {
            referenceItem.remove();
        }
    }

    /**
     * Reads every field in the form with FormData and builds a summary in
     * #summaryContent. All user-entered values are inserted with textContent,
     * never innerHTML, so typing something like <img src=x onerror=alert(1)>
     * into a field is displayed as plain text instead of being run.
     */
    displaySummary() {
        // Select the form and output elements
        const form = document.querySelector('#jobApplicationForm');
        const output = document.querySelector('#output');
        const summaryContent = document.querySelector('#summaryContent');

        // FormData collects every named input/select in the form, including
        // the ones we added dynamically. formData.get('name') returns one
        // value; formData.entries() lets us loop over [name, value] pairs.
        const formData = new FormData(form);

        // Clear previous summary. Assigning an empty string is a safe use of
        // innerHTML because no user data is involved. replaceChildren() is a
        // modern alternative that does the same thing.
        summaryContent.innerHTML = '';

        // --- Basic Information -------------------------------------------
        // METHOD 2 (innerHTML) is fine here because the markup is a fixed
        // string we wrote ourselves.
        const basicInfoSection = document.createElement('div');
        basicInfoSection.innerHTML = '<h4>Basic Information</h4>';
        const nameP = document.createElement('p');
        nameP.textContent = `Name: ${formData.get('fullName')}`;
        basicInfoSection.appendChild(nameP);
        const emailP = document.createElement('p');
        emailP.textContent = `Email: ${formData.get('email')}`;
        basicInfoSection.appendChild(emailP);
        const phoneP = document.createElement('p');
        phoneP.textContent = `Phone: ${formData.get('phone')}`;
        basicInfoSection.appendChild(phoneP);
        summaryContent.appendChild(basicInfoSection);

        // --- Skills --------------------------------------------------------
        const skillsSection = document.createElement('div');
        skillsSection.innerHTML = '<h4>Skills</h4>';
        const skillsList = document.createElement('ul');
        let hasSkills = false;
        for (const [key, value] of formData.entries()) {
            // Skill inputs are named skill1, skill2, ...; skip blank ones.
            if (key.startsWith('skill') && value.trim() !== '') {
                hasSkills = true;
                const li = document.createElement('li');
                li.textContent = value;
                skillsList.appendChild(li);
            }
        }
        if (hasSkills) {
            skillsSection.appendChild(skillsList);
        } else {
            const noSkills = document.createElement('p');
            noSkills.textContent = 'No skills added';
            skillsSection.appendChild(noSkills);
        }
        summaryContent.appendChild(skillsSection);

        // --- References ----------------------------------------------------
        const referencesSection = document.createElement('div');
        referencesSection.innerHTML = '<h4>References</h4>';
        const referencesDiv = document.createElement('div');
        let hasReferences = false;

        // Group reference data. Each reference has three inputs
        // (refName3, refEmail3, refRelationship3), so we use a regular
        // expression to split each name into the field and the id, then
        // collect them into one object per reference:
        //   { "3": { Name: "...", Email: "...", Relationship: "..." } }
        const references = {};
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('ref')) {
                const match = key.match(/^ref(Name|Email|Relationship)(\d+)$/);
                if (match) {
                    const field = match[1];   // "Name", "Email", or "Relationship"
                    const id = match[2];      // "1", "2", ...
                    if (!references[id]) {
                        references[id] = {};
                    }
                    references[id][field] = value;
                }
            }
        }

        // Display grouped references (skip ones that were left completely blank)
        for (const refId in references) {
            const ref = references[refId];
            if (ref.Name || ref.Email || ref.Relationship) {
                hasReferences = true;

                // Build each line with createElement/textContent. Do NOT write
                // refP.innerHTML = `<strong>${ref.Name}</strong>...` because
                // ref.Name is user input and could contain HTML (XSS).
                const refP = document.createElement('p');
                const nameStrong = document.createElement('strong');
                nameStrong.textContent = ref.Name || 'N/A';
                // append() accepts both elements and plain strings; strings
                // are added as text nodes, so they are never parsed as HTML.
                refP.append(
                    nameStrong,
                    document.createElement('br'),
                    `Email: ${ref.Email || 'N/A'}`,
                    document.createElement('br'),
                    `Relationship: ${ref.Relationship || 'N/A'}`
                );
                referencesDiv.appendChild(refP);
            }
        }
        if (hasReferences) {
            referencesSection.appendChild(referencesDiv);
        } else {
            const noRefs = document.createElement('p');
            noRefs.textContent = 'No references added';
            referencesSection.appendChild(noRefs);
        }
        summaryContent.appendChild(referencesSection);

        // Show the output section. Setting element.style changes the inline
        // style, which overrides "display: none" from the <style> block.
        output.style.display = 'block';

        // Scroll to the output
        output.scrollIntoView({ behavior: 'smooth' });
    }
}
