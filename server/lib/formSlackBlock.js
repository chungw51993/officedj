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
      text: '*/next*\nShow the next track to play',
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*/coming-up*\nShow tracks coming up',
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
      text: '*Unfortunately I\'m not a mind reader I only spin the tunes*\nPlease specify what song you want me to play',
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
  const t = tracks.slice(0, 5);
  const blocks = [];

  t.forEach((track) => {
    const {
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

    const hrefId = href.split('/');

    const value = {
      action: 'addTrack',
      album: album.name,
      albumCover: albumCover.url,
      artist: artist.name,
      name,
      id: hrefId[hrefId.length - 1],
    };

    blocks.push({
      type: 'actions',
      elements: [{
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Add it to the playlist',
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
      text: `<@${userId}> just added *${name} by ${artist}* to the playlist!`,
    },
  }];
};

export const trackGonged = (userId, gong) => {
  let text = `<@${userId}> just rang the gong! Need ${3 - gong} to skip the current track`;
  if (gong === 0) {
    text = 'GONG!!!!';
  }
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text,
    },
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
    artist,
    name,
  } = track;
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Current track playing is *${name} by ${artist}*`,
    },
  }];
};

export const noCurrentTrack = () => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Looks like my iPod ran out of tracks. Please use lookup to add more songs!',
    },
  }];
};

export const comingUp = (playlist) => {
  const blocks = [];
  playlist.forEach((track) => {
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
      text: 'Looks like current song playing is the last song on the playlist. Please add tracks if you want to keep the party going!',
    },
  }];
};
