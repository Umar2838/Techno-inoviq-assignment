"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchTeams,
  saveTeam,
  updateTeam,
  deleteTeam,
} from "./lib/firestoreHelper";

interface Pokemon {
  name: string;
  type: string;
  image: string;
  base_experience: number;
}

interface Team {
  id: string;
  name: string;
  pokemons: Pokemon[];
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [filtered, setFiltered] = useState<Pokemon[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeTeam = teams.find((t) => t.id === activeTeamId);

  useEffect(() => {
    async function fetchPokemons() {
      const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151");
      const data = await res.json();

      const pokemonList = await Promise.all(
        data.results.map(async (pokemon: any) => {
          const res = await fetch(pokemon.url);
          const details = await res.json();
          const types = details.types.map((t: any) => t.type.name).join(", ");
          return {
            name: pokemon.name,
            type: types,
            image: details.sprites.front_default,
            base_experience: details.base_experience,
          };
        })
      );

      setPokemons(pokemonList);
      setFiltered(pokemonList);
    }

    async function loadTeams() {
      const loadedTeams = await fetchTeams();
      setTeams(loadedTeams);
      if (loadedTeams.length > 0) setActiveTeamId(loadedTeams[0].id);
    }

    fetchPokemons();
    loadTeams();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setFiltered(
      pokemons.filter((p) => p.name.toLowerCase().includes(value.toLowerCase()))
    );
  };

  const addToTeam = async (pokemon: Pokemon) => {
    if (!activeTeam) return;
    if (activeTeam.pokemons.find((p) => p.name === pokemon.name)) return;
    if (activeTeam.pokemons.length >= 6) return;

    setLoading(true);
    const updated = {
      ...activeTeam,
      pokemons: [...activeTeam.pokemons, pokemon],
    };

    await updateTeam(activeTeam.id, { pokemons: updated.pokemons });
    const loaded = await fetchTeams();
    setTeams(loaded);
    setLoading(false);
  };

  const removeFromTeam = async (name: string) => {
    if (!activeTeam) return;
    setLoading(true);
    const updated = {
      ...activeTeam,
      pokemons: activeTeam.pokemons.filter((p) => p.name !== name),
    };
    await updateTeam(activeTeam.id, { pokemons: updated.pokemons });
    const loaded = await fetchTeams();
    setTeams(loaded);
    setLoading(false);
  };

  const renameTeam = async () => {
    if (!activeTeam) return;
    const newName = prompt("Enter new team name:", activeTeam.name);
    if (!newName || newName === activeTeam.name) return;
    setLoading(true);
    await updateTeam(activeTeam.id, { name: newName });
    const loaded = await fetchTeams();
    setTeams(loaded);
    setLoading(false);
  };

  const removeTeam = async () => {
    if (!activeTeam) return;
    const confirmed = confirm(
      `Are you sure you want to delete "${activeTeam.name}"?`
    );
    if (!confirmed) return;

    setLoading(true);
    await deleteTeam(activeTeam.id);
    const updatedTeams = await fetchTeams();
    setTeams(updatedTeams);
    setActiveTeamId(updatedTeams[0]?.id ?? null);
    setLoading(false);
  };

  const uniqueTypes = Array.from(
    new Set(
      (activeTeam?.pokemons || []).flatMap((p) =>
        p.type.split(",").map((t) => t.trim().toLowerCase())
      )
    )
  );

  const averageBaseExp =
    activeTeam && activeTeam.pokemons.length > 0
      ? Math.round(
          activeTeam.pokemons.reduce((acc, p) => acc + p.base_experience, 0) /
            activeTeam.pokemons.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-pink-100 p-4">
      {/* Team Management */}
      <div className="flex items-center text-black gap-3 mb-4">
        <select
          value={activeTeamId ?? ""}
          onChange={(e) => setActiveTeamId(e.target.value)}
          className="border text-black border-black rounded px-3 py-2"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

        <button
          onClick={async () => {
            const name = prompt("Team name:");
            if (!name) return;
            setLoading(true);
            const newTeam = { name, pokemons: [] };
            const docRef = await saveTeam(newTeam);
            const updated = await fetchTeams();
            setTeams(updated);
            setActiveTeamId(docRef.id);
            setLoading(false);
          }}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          + New Team
        </button>

        {activeTeam && (
          <button
            onClick={renameTeam}
            className="bg-yellow-500 text-white px-3 py-1 rounded"
          >
            ✏️ Rename
          </button>
        )}

        {activeTeam && (
          <button
            onClick={removeTeam}
            className="bg-yellow-500 text-white px-3 py-1 rounded"
          >
            ❌ Delete
          </button>
        )}
      </div>

      {loading && (
        <p className="text-center text-sm text-gray-700 mb-2">Loading...</p>
      )}

      {/* Search Bar */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex items-center bg-white rounded-full shadow-md overflow-hidden border border-gray-200">
          <input
            type="text"
            placeholder="Search Pokémon..."
            value={query}
            onChange={handleChange}
            className="flex-grow px-4 py-3 outline-none text-gray-700 placeholder-gray-400"
          />
          <div className="bg-red-500 text-white px-4 py-3">
            <Search size={20} />
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="mb-8 bg-white p-4 rounded-lg text-black shadow max-w-5xl mx-auto">
        <h2 className="text-lg font-bold mb-2">
          Your Team ({activeTeam?.pokemons.length ?? 0}/6)
        </h2>

        {activeTeam?.pokemons.length === 0 ? (
          <p className="text-gray-500 italic">No Pokémon selected.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-4">
              {activeTeam?.pokemons.map((pokemon, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 border rounded-lg p-2 shadow-sm bg-pink-50"
                >
                  <Image
                    src={pokemon.image}
                    alt={pokemon.name}
                    width={40}
                    height={40}
                  />
                  <div className="text-sm">
                    <p className="capitalize font-medium">{pokemon.name}</p>
                    <p className="text-xs text-gray-600">{pokemon.type}</p>
                  </div>
                  <button
                    onClick={() => removeFromTeam(pokemon.name)}
                    className="ml-2 text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-4 border-t pt-3">
              <h3 className="text-md font-semibold mb-1">Team Stats</h3>
              <p className="text-sm">
                <span className="font-medium">Types Covered:</span>{" "}
                {uniqueTypes.length > 0 ? uniqueTypes.join(", ") : "N/A"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Avg. Base Experience:</span>{" "}
                {averageBaseExp}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map((pokemon, index) => (
          <div
            key={index}
            className="bg-white p-4 text-black rounded-xl shadow hover:shadow-md text-center flex flex-col justify-between"
          >
            <Image
              src={pokemon.image}
              alt={pokemon.name}
              width={80}
              height={80}
              className="mx-auto"
            />
            <p className="capitalize mt-2 font-semibold">{pokemon.name}</p>
            <p className="text-sm text-gray-500 mb-2">Type: {pokemon.type}</p>
            <button
              onClick={() => addToTeam(pokemon)}
              disabled={
                activeTeam?.pokemons.length >= 6 ||
                activeTeam?.pokemons.some((p) => p.name === pokemon.name)
              }
              className={`text-white text-sm rounded-full py-1 mt-auto ${
                activeTeam?.pokemons.some((p) => p.name === pokemon.name) ||
                (activeTeam?.pokemons.length ?? 0) >= 6
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {activeTeam?.pokemons.some((p) => p.name === pokemon.name)
                ? "In Team"
                : (activeTeam?.pokemons.length ?? 0) >= 6
                ? "Full"
                : "Add to Team"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
