import { databases, storage } from '@/appwrite'
import { getTodosGroupedByColumn } from '@/lib/getTodosGroupedByColumn'
import { create } from 'zustand'

interface BoardState {
	board: Board
	getBoard: () => void
	setBoardState: (board: Board) => void
	updateTodoInDB: (todo: Todo, columnId: TypedColumn) => void
	searchString: string
	setSearchString: (searchString: string) => void
	deleteTask: (taskIndex: number, todoId: Todo, id: TypedColumn) => void
}

export const useBoardStore = create<BoardState>((set, get) => ({
	board: {
		columns: new Map<TypedColumn, Column>()
	},
	searchString: '',
	setSearchString: searchString => set({ searchString }),
	getBoard: async () => {
		const board = await getTodosGroupedByColumn()
		set({ board })
	},
	setBoardState: board => set({ board }),
	deleteTask: async (taskIndex: number, todo: Todo, id: TypedColumn) => {
		const newColumns = new Map(get().board.columns)

		// Delete todoId from newColumns
		newColumns.get(id)?.todos.splice(taskIndex, 1)

		set({ board: { columns: newColumns } })

		if (todo.image) {
			await storage.deleteFile(
				(todo.image as any).bucketId,
				(todo.image as any).fileId
			)
		}

		await databases.deleteDocument(
			process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
			process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
			todo.$id
		)
	},
	updateTodoInDB: async (todo, columnId) => {
		await databases.updateDocument(
			process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
			process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
			todo.$id,
			{
				title: todo.title,
				status: columnId
			}
		)
	}
}))
