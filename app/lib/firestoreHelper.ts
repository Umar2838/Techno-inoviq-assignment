// lib/firestoreHelpers.ts
import { db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";

const TEAMS_COLLECTION = "teams";

export async function saveTeam(team: Omit<Team, "id">) {
  return await addDoc(collection(db, TEAMS_COLLECTION), team);
}

export async function updateTeam(id: string, data: Partial<Team>) {
  const ref = doc(db, TEAMS_COLLECTION, id);
  return await updateDoc(ref, data);
}

export async function deleteTeam(id: string) {
  return await deleteDoc(doc(db, TEAMS_COLLECTION, id));
}

export async function fetchTeams(): Promise<Team[]> {
  const snapshot = await getDocs(collection(db, TEAMS_COLLECTION));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Team, "id">),
  }));
}
