document.addEventListener('DOMContentLoaded', function () {
    const documentList = document.getElementById('document-list');
    const searchInput = document.getElementById('search-input');
    const typeSort = document.getElementById('type-sort');
    const yearFilterContainer = document.querySelector('.year-filter');
    const departmentSelect = document.getElementById('department-select'); // Department select element

    let documents = [];

    // Fetch the JSON data (updated path)
    fetch('read.json?timestamp=' + new Date().getTime())  // Updated to point to the correct JSON file path
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.documents && data.documents.length > 0) {
                documents = data.documents;

                // Dynamically generate year buttons
                generateYearButtons(documents);

                // Filter and render documents on initial load
                filterAndRenderDocuments();

                // Event listeners for filters and search
                typeSort.addEventListener('change', filterAndRenderDocuments);
                searchInput.addEventListener('input', handleSearchInput);
                departmentSelect.addEventListener('change', filterAndRenderDocuments); // Event listener for department
            } else {
                console.error('No documents found in JSON file.');
            }
        })
        .catch(error => console.error('Error fetching JSON:', error));

    // Function to dynamically generate year buttons based on documents' effective dates
    function generateYearButtons(docs) {
        const yearSet = new Set(); // To avoid duplicates

        docs.forEach(doc => {
            const effectiveDate = new Date(doc.effectiveDate);
            if (!isNaN(effectiveDate)) {
                const year = effectiveDate.getFullYear();
                yearSet.add(year);
            }
        });

        // Clear previous buttons
        yearFilterContainer.innerHTML = '';

        // Create buttons for each year
        Array.from(yearSet).sort((a, b) => b - a).forEach(year => {
            const button = document.createElement('button');
            button.classList.add('year-button');
            button.dataset.year = year;
            button.textContent = year;

            // Add click event listener for each button
            button.addEventListener('click', (event) => {
                // Prevent default behavior that may cause a page jump
                event.preventDefault();
                event.stopPropagation();

                // Toggle the 'active' class for the clicked button (allow multiple active buttons)
                button.classList.toggle('active');
                filterAndRenderDocuments();
            });

            yearFilterContainer.appendChild(button);
        });
    }

   
   // Function to render documents
// Function to render documents
function renderDocuments(docs) {
    documentList.innerHTML = ''; // Clear existing items

    docs.forEach(doc => {
        const effectiveDate = new Date(doc.effectiveDate);
        const year = effectiveDate.getFullYear();

        // Use the keyDocument field directly, no need to add 'KeyDocument-' prefix
        const keyDocument = doc.keyDocument || 'UnknownKeyDocument';
        const title = doc.title || 'Untitled';
        const registryNo = doc.registryNo || 'UnknownRegistryNo';

        // Construct the filename without repeating 'KeyDocument-'
        const fileName = `${keyDocument} - ${title} - ${registryNo}.png`;
        const encodedFileName = encodeURIComponent(fileName);

        // Generate the full GitHub raw URL for the image
        const thumbnailUrl = `https://github.com/OderinConsulting/TFNKeyDocumentRegistry/raw/main/TFNKeyDocumentRegistry/images/${encodedFileName}`;

        // Construct the URL for the key document page
        const documentPageURL = `https://tfnkeydocumentregistry.netlify.app/${doc.keyDocument}`;

        // Google Drive file download link using the pdfFileId from the JSON
        const pdfFileId = doc.pdfFileId || '';
        const driveDownloadURL = pdfFileId ? `https://drive.google.com/uc?export=download&id=${pdfFileId}` : '#';

        const li = document.createElement('li');
        li.dataset.type = doc.type.toLowerCase();
        li.dataset.year = year;
        li.dataset.date = doc.effectiveDate;

        // Structuring the card with the thumbnail on the left side
        li.innerHTML = `
         <div class="card-content">
    <div class="thumbnail-section">
        <img src="${thumbnailUrl}" alt="${doc.title} thumbnail" class="thumbnail-image">
    </div>

    <!-- Container for icons and details (arranged next to each other) -->
    <div class="icon-text-container">
        <!-- Icon column placed next to the thumbnail -->
        <div class="icon-column">
            <!-- External link icon for key document page -->
            <a href="${documentPageURL}" target="_blank">
                <i class="fas fa-external-link-alt clickable-icon"></i>
            </a>
            <!-- Download icon for Google Drive link using pdfFileId -->
            <a href="${driveDownloadURL}" target="_blank">
                <i class="fas fa-download clickable-icon"></i>
            </a>
        </div>

        <!-- Details section next to the icons -->
        <div class="details-section">
            <!-- Title, Department, and Date stacked -->
            <div class="link-section">
                <a href="${documentPageURL}" class="document-link" target="_blank">
                    <span class="document-title">${doc.title}</span>
                </a>
            </div>
            <div class="department-section">
                <p class="contact-department">${doc.department}</p>
            </div>
            <div class="date-section">
                <p class="effective-date">Effective date: ${effectiveDate.toLocaleDateString()}</p>
            </div>
        </div>
    </div>
</div>

        `;

        documentList.appendChild(li);
    });
}



    // Function to handle search input and clear filters
    function handleSearchInput() {
        // Clear active filters
        document.querySelectorAll('.year-button').forEach(button => button.classList.remove('active'));

        filterAndRenderDocuments(true); // Pass true to indicate it's a search operation
    }

    // Function to filter and render documents
    function filterAndRenderDocuments(isSearch = false) {
        const type = typeSort.value.toLowerCase();
        const searchQuery = searchInput.value.toLowerCase().trim();
        const selectedDepartment = departmentSelect.value; // Keep department as-is

        // Get all active year buttons (if any)
        const activeYearButtons = document.querySelectorAll('.year-button.active');
        const activeYears = Array.from(activeYearButtons).map(button => parseInt(button.dataset.year));

        const filteredDocuments = documents.filter(doc => {
            const effectiveDateValid = doc.effectiveDate && !["n/a", "N/A", ""].includes(doc.effectiveDate.trim().toLowerCase());
            const docDepartment = doc.department?.toLowerCase(); // Convert document department to lowercase for comparison
        
            // Sunset date exclusion: check if sunset date is empty, N/A, or does not exist
            const noSunsetDate = !doc.sunsetDate || ["n/a", "N/A", ""].includes(doc.sunsetDate.trim().toLowerCase());
        
            // Handling "OSR" exception (case-sensitive)
            const matchesDepartment = selectedDepartment === 'all' ||
                          (selectedDepartment === 'OSR' && doc.department === 'OSR') ||
                          (selectedDepartment.toLowerCase() === docDepartment);

            const matchesType = type === 'all' || doc.type.toLowerCase() === type;
            const matchesYear = activeYears.length === 0 || activeYears.includes(new Date(doc.effectiveDate).getFullYear());
            const matchesSearch = searchQuery === '' || doc.title.toLowerCase().includes(searchQuery); 
            
            // Ensure all previous conditions still apply along with noSunsetDate
            return matchesType && matchesYear && matchesSearch && matchesDepartment && effectiveDateValid && noSunsetDate;
        });

        // Sort documents by effective date (most recent first)
        filteredDocuments.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));

        renderDocuments(filteredDocuments);
    }
});
