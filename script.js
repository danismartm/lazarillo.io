document.addEventListener("DOMContentLoaded", () => {
    // 1. Referencias a los elementos del formulario
    const titleInput = document.getElementById("title");
    const titleSizeInput = document.getElementById("title-size");
    const subtitleInput = document.getElementById("subtitle");
    const locationInput = document.getElementById("location");
    const dateInput = document.getElementById("date");
    const timeInput = document.getElementById("time");
    const linkInput = document.getElementById("registration-link");
    
    // Nuevas funcionalidades
    const showQrCheckbox = document.getElementById("show-qr");
    const linkGroup = document.getElementById("link-group");
    const bgImageInput = document.getElementById("bg-image");

    // Selectores de formato y tema
    const themeSelect = document.getElementById("card-theme");
    const formatSelect = document.getElementById("card-format");
    const btnNextTheme = document.getElementById("btn-next-theme");

    // 2. Referencias a los elementos en la vista previa del canvas (Tarjeta)
    const previewTitle = document.getElementById("preview-title");
    const previewSubtitle = document.getElementById("preview-subtitle");
    const previewLocation = document.getElementById("preview-location");
    const previewDate = document.getElementById("preview-date");
    const previewTime = document.getElementById("preview-time");
    
    // Contenedores del QR
    const qrSection = document.getElementById("qr-section");
    const qrContainer = document.getElementById("qrcode-container");
    const qrLabel = document.getElementById("qr-label");
    const cardElement = document.getElementById("card-preview");

    // Instancia global del código QR
    let qrcode = null;

    /**
     * Helper para formatear la fecha a dd/mm/yyyy.
     */
    const formatDate = (dateString) => {
        if(!dateString) return "";
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    /**
     * Mantiene actualizado el elemento QR en base al input opcional
     */
    const updateQR = (url) => {
        qrContainer.innerHTML = "";
        
        if (showQrCheckbox.checked) {
            linkGroup.style.display = "flex"; // Mostrar input de url
            
            if (url && url.trim() !== "") {
                qrSection.style.display = "flex";
                qrcode = new QRCode(qrContainer, {
                    text: url,
                    width: 90,
                    height: 90,
                    colorDark : "#111111",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
            } else {
                qrSection.style.display = "none";
            }
        } else {
            linkGroup.style.display = "none"; // Ocultar input de url
            qrSection.style.display = "none"; // Ocultar vista del QR
        }
    };

    /**
     * Reacciona a los cambios en el formulario y sincroniza el documento de vista previa
     */
    const updatePreview = () => {
        // Textos directos
        previewTitle.textContent = titleInput.value || "Sin Titulo";
        previewSubtitle.textContent = subtitleInput.value || "Sin Subtitulo";
        previewLocation.textContent = locationInput.value || "Ubicacion por definir";
        
        // Fecha y hora
        previewDate.textContent = dateInput.value ? formatDate(dateInput.value) : "Sin fecha";
        previewTime.textContent = timeInput.value || "Sin hora";

        // Tamano del Titulo (Pequeno, Mediano, Grande)
        previewTitle.className = ""; // Limpiamos la clase anterior
        previewTitle.classList.add(`title-${titleSizeInput.value}`);

        // Actualizamos codigo QR
        updateQR(linkInput.value);
    };

    // 3. Vincular los Event Listeners "en tiempo real"
    titleInput.addEventListener("input", updatePreview);
    titleSizeInput.addEventListener("change", updatePreview);
    subtitleInput.addEventListener("input", updatePreview);
    locationInput.addEventListener("input", updatePreview);
    dateInput.addEventListener("change", updatePreview); // Al ser un datepicker, "change" lanza al cerrar/escoger
    timeInput.addEventListener("input", updatePreview);  // Usamos input o change
    linkInput.addEventListener("input", updatePreview);
    showQrCheckbox.addEventListener("change", updatePreview);

    // Gestor de formato y tema
    themeSelect.addEventListener("change", () => {
        cardElement.className = cardElement.className.replace(/\btheme-\S+/g, '');
        cardElement.classList.add(`theme-${themeSelect.value}`);
    });
    
    // Botón mágico para ciclar entre temas
    btnNextTheme.addEventListener("click", () => {
        const options = Array.from(themeSelect.options);
        let currentIndex = options.findIndex(opt => opt.selected);
        let nextIndex = (currentIndex + 1) % options.length;
        themeSelect.selectedIndex = nextIndex;
        // Lanzamos el evento change para que la tarjeta se actualice
        themeSelect.dispatchEvent(new Event("change"));
    });

    formatSelect.addEventListener("change", () => {
        cardElement.className = cardElement.className.replace(/\bformat-\S+/g, '');
        cardElement.classList.add(`format-${formatSelect.value}`);
    });

    // Gestor de la imagen de fondo con FileReader
    bgImageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                cardElement.style.backgroundImage = `url('${event.target.result}')`;
                cardElement.classList.add("has-bg");
            };
            reader.readAsDataURL(file);
        } else {
            cardElement.style.backgroundImage = "none";
            cardElement.classList.remove("has-bg");
        }
    });

    // ===============================================
    // 4. Logica de Descarga del Documento Final (PDF/Imagen)
    // ===============================================
    const downloadBtn = document.getElementById("download-btn");

    downloadBtn.addEventListener("click", () => {
        // 4.1. Preparamos temporalmente los estilos CSS para una captura optima.
        const originalShadow = cardElement.style.boxShadow;
        cardElement.style.boxShadow = "none";
        cardElement.style.borderRadius = "0px";

        // Usamos la libreria html2canvas
        html2canvas(cardElement, {
            scale: 2,               
            useCORS: true,          
            backgroundColor: "#fff" 
        }).then((canvas) => {
            // 4.2. Restaurar diseño de preview en la web
            cardElement.style.boxShadow = originalShadow;
            cardElement.style.borderRadius = "12px";

            // 4.3. Parseamos a DataURI PNG
            const imageURI = canvas.toDataURL("image/png");

            // 4.4. Trigger de la descarga desde el navegador
            let baseName = titleInput.value.trim().replace(/\s+/g, "_") || "Documento";
            let fileName = `${baseName}_ID.png`;

            const tempLink = document.createElement("a");
            tempLink.download = fileName;
            tempLink.href = imageURI;
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);

        }).catch((err) => {
            console.error("Fallo al exportar el documento", err);
            alert("No se pudo generar la tarjeta.");
            cardElement.style.boxShadow = originalShadow;
            cardElement.style.borderRadius = "12px";
        });
    });

    // 5. Arranque inicial
    updatePreview();
});
