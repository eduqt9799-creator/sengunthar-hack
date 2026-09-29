import os
import qrcode
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
from config import QR_DIR, FRONTEND_BASE_URL

def generate_batch_qr(batch_id: str, batch_name: str = "") -> str:
    """
    Generates a QR code linking to the digital batch report URL.
    Saves image into backend/uploads/qrcodes/<batch_id>.png
    Returns relative path for API serving (e.g. /uploads/qrcodes/<batch_id>.png)
    """
    target_url = f"{FRONTEND_BASE_URL}/batches/{batch_id}"
    
    # Generate QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(target_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#0F172A", back_color="#FFFFFF").convert('RGB')
    
    # Add high-visibility top and bottom branding banners
    width, height = img.size
    new_height = height + 60
    new_img = Image.new('RGB', (width, new_height), (255, 255, 255))
    new_img.paste(img, (0, 10))

    draw = ImageDraw.Draw(new_img)
    # Simple text drawing
    text_content = f"ID: {batch_id}"
    draw.rectangle([(0, height + 10), (width, new_height)], fill="#0F172A")
    draw.text((width // 4, height + 22), text_content, fill="#38BDF8")

    file_name = f"qr_{batch_id.replace('/', '_')}.png"
    file_path = QR_DIR / file_name
    new_img.save(file_path, "PNG")

    return f"/uploads/qrcodes/{file_name}"
