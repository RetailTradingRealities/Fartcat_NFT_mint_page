// utils/getSingleImage.ts
type NFTItem = {
    image_link: string;
    [key: string]: any;
  };
  
  type CacheJson = {
    items: {
      [key: string]: NFTItem;
    };
  };
  
  export async function getSingleImageLink(index: number): Promise<string | null> {
    try {
      const res = await fetch('/cache.json');
      const data: CacheJson = await res.json();
  
      const item = data.items[index.toString()];
      if (!item || !item.image_link) return null;
  
      return item.image_link.split('?')[0]; // remove ?ext=png
    } catch (err) {
      console.error('Error fetching image:', err);
      return null;
    }
  }
  