import { create } from 'zustand'
import { StatChanges, StatCheck, usePlayerStats } from './playerStats'
import { useChoiceHistory } from './choiceHistory'

export interface DialogueOption {
  text: string
  statChanges?: StatChanges
  statCheck?: StatCheck
  nextNodeId?: string
  tags?: string[]
  consequence?: string
}

export interface DialogueNode {
  id: string
  speaker: string
  text: string
  options?: DialogueOption[]
}

interface DialogueState {
  isOpen: boolean
  isMeetingBattle: boolean
  currentNode: DialogueNode | null
  dialogueTree: DialogueNode[]
  dialogueId: string
  consequence: string | null
  showingConsequence: boolean
  openDialogue: (dialogueId: string, startNodeId: string, tree: DialogueNode[], meetingBattle?: boolean) => void
  selectOption: (optionIndex: number) => void
  advanceOrClose: () => void
  closeDialogue: () => void
}

export const useDialogueState = create<DialogueState>((set, get) => ({
  isOpen: false,
  isMeetingBattle: false,
  currentNode: null,
  dialogueTree: [],
  dialogueId: '',
  consequence: null,
  showingConsequence: false,

  openDialogue: (dialogueId, startNodeId, tree, meetingBattle = false) => {
    const startNode = tree.find((n) => n.id === startNodeId)
    set({
      isOpen: true,
      isMeetingBattle: meetingBattle,
      currentNode: startNode ?? null,
      dialogueTree: tree,
      dialogueId,
      consequence: null,
      showingConsequence: false,
    })
  },

  selectOption: (optionIndex) => {
    const { currentNode, dialogueTree, dialogueId } = get()
    if (!currentNode?.options?.[optionIndex]) return

    const option = currentNode.options[optionIndex]

    // Apply stat changes
    if (option.statChanges) {
      usePlayerStats.getState().modifyStats(option.statChanges, `dialogue:${dialogueId}:${currentNode.id}`)
    }

    // Record choice
    if (option.tags?.length) {
      useChoiceHistory.getState().recordChoice({
        dialogueId,
        nodeId: currentNode.id,
        optionIndex,
        tags: option.tags,
        levelId: '', // set by caller
      })
    }

    // Show consequence
    if (option.consequence) {
      set({ consequence: option.consequence, showingConsequence: true })
      setTimeout(() => {
        const state = get()
        if (!state.isOpen) return

        if (option.nextNodeId) {
          const nextNode = state.dialogueTree.find((n) => n.id === option.nextNodeId)
          set({ currentNode: nextNode ?? null, consequence: null, showingConsequence: false })
          if (!nextNode) set({ isOpen: false })
        } else {
          set({ isOpen: false, currentNode: null, consequence: null, showingConsequence: false })
        }
      }, 1500)
    } else {
      // No consequence, advance immediately
      if (option.nextNodeId) {
        const nextNode = dialogueTree.find((n) => n.id === option.nextNodeId)
        set({ currentNode: nextNode ?? null })
        if (!nextNode) set({ isOpen: false })
      } else {
        set({ isOpen: false, currentNode: null })
      }
    }
  },

  advanceOrClose: () => {
    const { currentNode, dialogueTree } = get()
    if (!currentNode) {
      set({ isOpen: false })
      return
    }
    // If no options, just close (or could auto-advance to a linked node)
    if (!currentNode.options?.length) {
      set({ isOpen: false, currentNode: null })
    }
  },

  closeDialogue: () => set({ isOpen: false, isMeetingBattle: false, currentNode: null, consequence: null, showingConsequence: false }),
}))
