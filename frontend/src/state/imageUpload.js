import { atom, useAtom } from "jotai";
import { v4 as uuidv4 } from "uuid";
import * as endpoints from "../api/endpoints";
import { useAuth } from "./auth";

const imageUploadAtom = atom([]);

export const useImageUpload = () => {
  const { accessToken } = useAuth();
  const [photos, setPhotos] = useAtom(imageUploadAtom);

  const addPhoto = ({ name, file }) => {
    const id = uuidv4();

    setPhotos((prev) => [...prev, { name, file, id }]);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotos((prev) => {
        const thisPhoto = prev.find((photo) => photo.id == id);
        if (!thisPhoto) {
          return [...prev, { name, url: e.target.result, file, id }];
        }
        return [
          ...prev.filter((photo) => photo.id != id),
          {
            ...thisPhoto,
            url: e.target.result,
          },
        ];
      });
    };
    reader.readAsDataURL(file);

    endpoints.uploadPhoto({ name, file, accessToken }).then((data) => {
      setPhotos((prev) => {
        const thisPhoto = prev.find((photo) => photo.id == id);

        if (!thisPhoto) {
          endpoints.deletePhoto({ key: data.key, accessToken }).catch((_e) => {
            // ignore error
          });
          return prev;
        }

        return [
          ...prev.filter((photo) => photo.id != id),
          {
            ...thisPhoto,
            key: data.key,
          },
        ];
      });
    });
  };

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const thisPhoto = prev.find((photo) => photo.id == id);
      if (thisPhoto.key) {
        endpoints
          .deletePhoto({ key: thisPhoto.key, accessToken })
          .catch((_e) => {
            // ignore error
          });
      }

      return prev.filter((photo) => photo.id != id);
    });
  };

  const clear = () => {
    photos.forEach((photo) => {
      if (photo.key) {
        endpoints.deletePhoto({ key: photo.key, accessToken }).catch((_e) => {
          // ignore error
        });
      }
    });

    setPhotos([]);
  };

  const reset = () => {
    setPhotos([]);
  };

  const getLatest = () => {
    let out = [];
    setPhotos((prev) => {
      out = [...prev];
      return prev;
    });
    return out;
  };

  return {
    addPhoto,
    removePhoto,
    clear,
    reset,
    getLatest,
    photos,
  };
};
