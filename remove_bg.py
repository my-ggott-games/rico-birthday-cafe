
import os
from PIL import Image

def remove_white_bg(image_path):
    try:
        img = Image.open(image_path).convert("RGBA")
        datas = img.getdata()

        new_data = []
        for item in datas:
            # Change all white (also shades of whites)
            # to transparent
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)

        img.putdata(new_data)
        img.save(image_path, "PNG")
        print(f"Processed: {image_path}")
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

assets_dir = "./frontend/public/assets"
files = ["cody_base.png", "cody_top_1.png", "cody_top_2.png", "cody_bottom_1.png"]

for f in files:
    remove_white_bg(os.path.join(assets_dir, f))
