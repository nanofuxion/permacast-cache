import { smartweave, arweave } from "./arweave.js";
import { BLACKLIST } from "./constants/blacklist.js";
import { readContract } from "smartweave";
import { gqlTemplate, permacastDeepGraphs } from "./gql.js";
import base64url from "base64url";

export async function getFactoriesObjects() {
  const factories = [];
  const factoriesObjects = await gqlTemplate(permacastDeepGraphs.factories);

  for (let factory of factoriesObjects) {
    factories.push({
      id: factory.id,
      owner: factory.owner,
      timestamp: factory.timestamp,
    });
  }

  return factories;
}

async function blacklistFactoryPodcast(state) {
  // blacklist a podcast based on its pid
  // remove the podcast object from the factory's
  // state and return the new state if blacklist
  // was found
  const blacklistedPodcastsArray = BLACKLIST.podcasts;
  const blacklistedPodcasts = state.podcasts.filter((podObj) =>
    blacklistedPodcastsArray.includes(podObj.pid)
  );

  if (blacklistedPodcastsArray.length > 0) {
    const filteredState = state.podcasts.filter(
      (pod) => !blacklistedPodcasts.includes(pod)
    );
    return filteredState;
  }

  return state;
}


export async function getFactoriesState() {
  const factoriesObj = await getFactoriesObjects();
  const states = [];
  for (let factory of factoriesObj) {
    const unfiliteredState = await getStateOf(factory.id);

    // set factory metadata
    if (unfiliteredState) {
      const state = await blacklistFactoryPodcast(unfiliteredState);

      state.factory_id = factory.id;
      state.owner = factory.owner;
      state.factoryCreationTimestamp = factory.timestamp;
      states.push(state);
    }
  }

  const response = {
    res: states,
  };
  return base64url(JSON.stringify(response));
}


async function getStateOf(contractId) {
  // const contract = smartweave.contract(contractId);
  // const contractState = (await contract.readState()).state;
  try {
    const contractState = await readContract(arweave, contractId);

    return contractState;
  } catch (error) {
    console.log(error);
    return false;
  }
}

