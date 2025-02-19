import { log } from 'app/logging/useLogger';
import { startAppListening } from '..';
import { receivedPageOfImages } from 'services/api/thunks/image';
import {
  imageCategoriesChanged,
  selectFilteredImagesAsArray,
} from 'features/gallery/store/imagesSlice';

const moduleLog = log.child({ namespace: 'gallery' });

export const addImageCategoriesChangedListener = () => {
  startAppListening({
    actionCreator: imageCategoriesChanged,
    effect: (action, { getState, dispatch }) => {
      const state = getState();
      const filteredImagesCount = selectFilteredImagesAsArray(state).length;

      if (!filteredImagesCount) {
        dispatch(
          receivedPageOfImages({
            categories: action.payload,
            board_id: state.boards.selectedBoardId,
            is_intermediate: false,
          })
        );
      }
    },
  });
};
