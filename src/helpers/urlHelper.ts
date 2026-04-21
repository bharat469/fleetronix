import Config from 'react-native-config';

/**
 * Resolves a potentially relative image path to a full URL.
 * Falls back to a default profile picture if no path is provided.
 */
export const resolveImageUrl = (path: string | undefined | null) => {
  if (!path) return 'https://randomuser.me/api/portraits/men/32.jpg';
  
  // If it's already a full URL or a local file/content URI
  if (path.startsWith('http') || path.startsWith('file://') || path.startsWith('content://')) {
    return path;
  }
  
  const baseUrl = Config.IMAGE_BASE_URL || (Config.API_BASE_URL || 'http://103.197.76.50:8087/api').replace('/api', '');
  const cleanPath = path.replace(/^\//, ''); 
  return `${baseUrl}/${cleanPath}`;
};
