import{useEffect,useState}from'react';import{storageService}from'../services/storageService';
export function usePersistentState(key,fallback){const[state,setState]=useState(()=>storageService.get(key,fallback));useEffect(()=>storageService.set(key,state),[key,state]);return[state,setState]}
