const {
  CLIENT_URL,
} = process.env;

export const help = () => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*/lookup*\nSearch for track by using track name',
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*/gong*\nRing the gong for current track to be skipped - 3 gongs will skip the track',
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*/gong-count*\nShow gong count for current track playing',
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*/current*\nShow current track playing',
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*/coming-up*\nShow tracks coming up',
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*/host*\nShow current host',
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*/reset*\nReset DJ Delta to factory setting',
    },
  }, {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Got it',
        },
        value: 'ignore',
      },
    ],
  }];
};

export const noTrack = (track) => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Unfortunately I don't have ${track} in my iPod*\nPlease try searching for a different song`,
    },
  }, {
    type: 'actions',
    elements: [{
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Let me try again',
      },
      value: 'ignore',
    }],
  }];
};

export const needSongName = () => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*Unfortunately I\'m not a mind reader I only play the tunes*\nPlease specify what song you want me to play',
    },
  }, {
    type: 'actions',
    elements: [{
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Let me try again',
      },
      value: 'ignore',
    }],
  }];
};

export const lookup = (tracks) => {
  const t = tracks.slice(0, 3);
  const blocks = [];

  t.forEach((track) => {
    const {
      id,
      album,
      artists,
      href,
      name,
    } = track;

    const [artist] = artists;
    const albumCover = album.images[2];

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${artist.name}*\n${name}\n${album.name}`,
      },
      accessory: {
        type: 'image',
        image_url: albumCover.url,
        alt_text: 'Album Cover',
      },
    });

    const value = {
      action: 'addTrack',
      album: album.name,
      albumCover: albumCover.url,
      artist: artist.name,
      name,
      id,
    };

    blocks.push({
      type: 'actions',
      elements: [{
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Add it to the queue',
        },
        value: JSON.stringify(value),
      }],
    });
  });

  blocks.push({
    type: 'actions',
    elements: [{
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Cancel',
      },
      value: 'ignore',
    }],
  });

  return blocks;
};

export const trackAdded = (userId, track) => {
  const {
    artist,
    name,
  } = track;
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `<@${userId}> just added *${name} by ${artist}* to the queue!`,
    },
  }];
};

export const trackGonged = (userId, gong) => {
  let text = `<@${userId}> just rang the gong! Need ${3 - gong} more to skip the current song`;
  if (gong === 0) {
    text = ':bell: GONG!!!';
  }
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text,
    },
  }];
};

export const alreadyGonged = (userId) => {
  const responses = [
    'Okay I understand that you don\'t like this song but you can only gong once a song.',
    'I actually took away your gong stick since you can only gong once per song.',
    'Maybe try to get other people to gong because you can only gong once per song.',
    'Look like you\'re all out of gongs, your next gong is going to cost 99 cents. Just kidding! But seriously you can only gong once per song.',
    'Unfortunately there is a one gong per song policy. To change the policy please start a petition and submit it to my creator.',
  ];
  const randomIdx = Math.floor(Math.random() * responses.length);
  const text = responses[randomIdx];
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text,
    },
  }, {
    type: 'actions',
    elements: [{
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Got it',
      },
      value: 'ignore',
    }],
  }];
};

export const gongCount = (gong) => {
  let count = '';
  if (gong !== 0) {
    for (let i = 0; i < gong; i += 1) {
      count += ':bell: ';
    }
  } else {
    count = 0;
  }
  return [{
    type: 'section',
    text: {
      type: 'plain_text',
      text: `Current Gong Count: ${count}`,
      emoji: true,
    },
  }];
};

export const currentTrack = (track) => {
  const {
    album,
    artists,
    href,
    name,
  } = track;
  const [artist] = artists;
  const albumCover = album.images[2];
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Current song playing*`,
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${artist.name}*\n${name}\n${album.name}`,
    },
    accessory: {
      type: 'image',
      image_url: albumCover.url,
      alt_text: 'Album Cover',
    },
  }];
};

export const noTrackToGong = () => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'I get that you want to ring the gong badly but currently there is no song playing!',
    },
  }, {
    type: 'actions',
    elements: [{
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Got it',
      },
      value: 'ignore',
    }],
  }];
}

export const noCurrentTrack = () => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Looks like my iPod ran out of tracks. Please use lookup to add more songs!',
    },
  }, {
    type: 'actions',
    elements: [{
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Got it',
      },
      value: 'ignore',
    }],
  }];
};

export const comingUp = (queue) => {
  const blocks = [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Coming up*`,
    },
  }];
  queue.slice(0, 3).forEach((track) => {
    const {
      album,
      albumCover,
      artist,
      name,
    } = track;
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${artist}*\n${name}\n${album}`,
      },
      accessory: {
        type: 'image',
        image_url: albumCover,
        alt_text: 'Album Cover',
      },
    });
  });
  return blocks;
};

export const noComingUp = () => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Uh oh looks like there isn\'t any more songs in the queue. Please add more songs to keep this going!',
    },
  }, {
    type: 'actions',
    elements: [{
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Got it',
      },
      value: 'ignore',
    }],
  }];
};

export const noUser = () => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Unfortunately I need a host to function. Please go to ${CLIENT_URL} to become a host.`,
    },
  }];
};

export const noDevice = (user) => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `I still need a device to play the songs so ${user.email} needs to turn on Spotify on the computer, phone, fridge, or etc...`,
    },
  }];
};

export const currentHost = (user) => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Currently my iPod is under ${user.email}'s desk`,
    },
  }];
};

export const confirmReset = () => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Are you sure you want to reset DJ Delta? The current queue will be lost and we\'ll have to start all over.',
    },
  }, {
    type: 'actions',
    elements: [{
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Nope',
      },
      value: 'ignore',
    }, {
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'RESET',
      },
      value: JSON.stringify({
        action: 'resetState',
      }),
    }],
  }];
};

export const deltaReset = (userId) => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:cd:*Record Scratch*:cd: <@${userId}> just pressed the RESET button!\nResetting to factory setting...\nPlease visit ${CLIENT_URL} to become a host.`,
    },
  }];
}
