import {
  Badge,
  Box,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  Image,
  MenuItem,
  MenuList,
  useColorMode,
} from '@chakra-ui/react';

import { useAppDispatch } from 'app/store/storeHooks';
import { memo, useCallback, useContext } from 'react';
import { FaFolder, FaTrash } from 'react-icons/fa';
import { ContextMenu } from 'chakra-ui-contextmenu';
import { BoardDTO, ImageDTO } from 'services/api/types';
import { IAINoImageFallback } from 'common/components/IAIImageFallback';
import { boardIdSelected } from 'features/gallery/store/boardSlice';
import { useAddImageToBoardMutation } from 'services/api/endpoints/boardImages';
import {
  useDeleteBoardMutation,
  useUpdateBoardMutation,
} from 'services/api/endpoints/boards';
import { useGetImageDTOQuery } from 'services/api/endpoints/images';

import { skipToken } from '@reduxjs/toolkit/dist/query';
import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence } from 'framer-motion';
import IAIDropOverlay from 'common/components/IAIDropOverlay';
import { SelectedItemOverlay } from '../SelectedItemOverlay';
import { DeleteBoardImagesContext } from '../../../../app/contexts/DeleteBoardImagesContext';
import { mode } from 'theme/util/mode';

interface HoverableBoardProps {
  board: BoardDTO;
  isSelected: boolean;
}

const HoverableBoard = memo(({ board, isSelected }: HoverableBoardProps) => {
  const dispatch = useAppDispatch();

  const { currentData: coverImage } = useGetImageDTOQuery(
    board.cover_image_name ?? skipToken
  );

  const { colorMode } = useColorMode();

  const { board_name, board_id } = board;

  const { onClickDeleteBoardImages } = useContext(DeleteBoardImagesContext);

  const handleSelectBoard = useCallback(() => {
    dispatch(boardIdSelected(board_id));
  }, [board_id, dispatch]);

  const [updateBoard, { isLoading: isUpdateBoardLoading }] =
    useUpdateBoardMutation();

  const [deleteBoard, { isLoading: isDeleteBoardLoading }] =
    useDeleteBoardMutation();

  const [addImageToBoard, { isLoading: isAddImageToBoardLoading }] =
    useAddImageToBoardMutation();

  const handleUpdateBoardName = (newBoardName: string) => {
    updateBoard({ board_id, changes: { board_name: newBoardName } });
  };

  const handleDeleteBoard = useCallback(() => {
    deleteBoard(board_id);
  }, [board_id, deleteBoard]);

  const handleDeleteBoardAndImages = useCallback(() => {
    console.log({ board });
    onClickDeleteBoardImages(board);
  }, [board, onClickDeleteBoardImages]);

  const handleDrop = useCallback(
    (droppedImage: ImageDTO) => {
      if (droppedImage.board_id === board_id) {
        return;
      }
      addImageToBoard({ board_id, image_name: droppedImage.image_name });
    },
    [addImageToBoard, board_id]
  );

  const {
    isOver,
    setNodeRef,
    active: isDropActive,
  } = useDroppable({
    id: `board_droppable_${board_id}`,
    data: {
      handleDrop,
    },
  });

  return (
    <Box sx={{ touchAction: 'none' }}>
      <ContextMenu<HTMLDivElement>
        menuProps={{ size: 'sm', isLazy: true }}
        renderMenu={() => (
          <MenuList sx={{ visibility: 'visible !important' }}>
            {board.image_count > 0 && (
              <MenuItem
                sx={{ color: 'error.300' }}
                icon={<FaTrash />}
                onClickCapture={handleDeleteBoardAndImages}
              >
                Delete Board and Images
              </MenuItem>
            )}
            <MenuItem
              sx={{ color: mode('error.700', 'error.300')(colorMode) }}
              icon={<FaTrash />}
              onClickCapture={handleDeleteBoard}
            >
              Delete Board
            </MenuItem>
          </MenuList>
        )}
      >
        {(ref) => (
          <Flex
            key={board_id}
            userSelect="none"
            ref={ref}
            sx={{
              flexDir: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              w: 'full',
              h: 'full',
            }}
          >
            <Flex
              ref={setNodeRef}
              onClick={handleSelectBoard}
              sx={{
                position: 'relative',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 'base',
                w: 'full',
                aspectRatio: '1/1',
                overflow: 'hidden',
              }}
            >
              {board.cover_image_name && coverImage?.image_url && (
                <Image src={coverImage?.image_url} draggable={false} />
              )}
              {!(board.cover_image_name && coverImage?.image_url) && (
                <IAINoImageFallback iconProps={{ boxSize: 8 }} as={FaFolder} />
              )}
              <Flex
                sx={{
                  position: 'absolute',
                  insetInlineEnd: 0,
                  top: 0,
                  p: 1,
                }}
              >
                <Badge variant="solid">{board.image_count}</Badge>
              </Flex>
              <AnimatePresence>
                {isSelected && <SelectedItemOverlay />}
              </AnimatePresence>
              <AnimatePresence>
                {isDropActive && <IAIDropOverlay isOver={isOver} />}
              </AnimatePresence>
            </Flex>

            <Box sx={{ width: 'full' }}>
              <Editable
                defaultValue={board_name}
                submitOnBlur={false}
                onSubmit={(nextValue) => {
                  handleUpdateBoardName(nextValue);
                }}
              >
                <EditablePreview
                  sx={{
                    color: isSelected
                      ? mode('base.900', 'base.50')(colorMode)
                      : mode('base.700', 'base.200')(colorMode),
                    fontWeight: isSelected ? 600 : undefined,
                    fontSize: 'xs',
                    textAlign: 'center',
                    p: 0,
                  }}
                  noOfLines={1}
                />
                <EditableInput
                  sx={{
                    color: mode('base.900', 'base.50')(colorMode),
                    fontSize: 'xs',
                    borderColor: mode('base.500', 'base.500')(colorMode),
                    p: 0,
                    outline: 0,
                  }}
                />
              </Editable>
            </Box>
          </Flex>
        )}
      </ContextMenu>
    </Box>
  );
});

HoverableBoard.displayName = 'HoverableBoard';

export default HoverableBoard;
