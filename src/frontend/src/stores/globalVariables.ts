import { create } from "zustand";
import { GlobalVariablesStore } from "../types/zustand/globalVariables";

export const useGlobalVariablesStore = create<GlobalVariablesStore>(
  (set, get) => ({
    globalVariablesEntries: [],
    globalVariables: {},
    setGlobalVariables: (variables) => {
      set({
        globalVariables: variables,
        globalVariablesEntries: Object.keys(variables),
      });
    },
    addGlobalVariable: (name, id, category, value) => {
      const data = { id, category, value };
      const newVariables = { ...get().globalVariables, [name]: data };
      set({
        globalVariables: newVariables,
        globalVariablesEntries: Object.keys(newVariables),
      });
    },
    removeGlobalVariable: (name) => {
      const newVariables = { ...get().globalVariables };
      delete newVariables[name];
      set({
        globalVariables: newVariables,
        globalVariablesEntries: Object.keys(newVariables),
      });
    },
    getVariableId: (name) => {
      return get().globalVariables[name]?.id;
    },
  })
);
