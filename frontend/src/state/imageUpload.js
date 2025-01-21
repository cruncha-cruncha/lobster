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
          console.log("UHOH");
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

    endpoints.uploadPhoto({ file, accessToken }).then((data) => {
      setPhotos((prev) => {
        const thisPhoto = prev.find((photo) => photo.id == id);

        if (!thisPhoto) {
          endpoints.deletePhoto({ id: data.id, accessToken }).catch((_e) => {
            // ignore error
          });
          return prev;
        }

        return [
          ...prev.filter((photo) => photo.id != id),
          {
            ...thisPhoto,
            remoteId: data.id,
          },
        ];
      });
    });
  };

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const thisPhoto = prev.find((photo) => photo.id == id);
      if (thisPhoto.remoteId) {
        endpoints
          .deletePhoto({ id: thisPhoto.remoteId, accessToken })
          .catch((_e) => {
            // ignore error
          });
      }

      return prev.filter((photo) => photo.id != id);
    });
  };

  const clear = () => {
    photos.forEach((photo) => {
      if (photo.remoteId) {
        endpoints
          .deletePhoto({ id: photo.remoteId, accessToken })
          .catch((_e) => {
            // ignore error
          });
      }
    });

    setPhotos([]);
  };

  return {
    addPhoto,
    removePhoto,
    clear,
    photos,
  };
};
