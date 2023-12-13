document.addEventListener('DOMContentLoaded', () => {
  const downloadButton = document.getElementById('download_button');

  downloadButton.addEventListener('click', () => {
    fetch('/usp-lab/download-files')
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'lab_files.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
    .catch((error) => console.error('Error:', error));
  });
});

