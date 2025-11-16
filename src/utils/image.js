// src/utils/image.js
export function compressAndConvertToBase64(
  file,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.7
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const base64 = canvas.toDataURL("image/jpeg", quality);
      resolve(base64);
    };

    img.onerror = reject;
  });
}
