const formatSlackTrackMessage = (tracks) => {
  const t = tracks.slice(0, 3);
  const blocks = [];

  t.forEach((track) => {
    const {
      album,
      artists,
      href,
      name,
    } = track;

    const [firstArtist] = artists;
    const albumCover = album.images[2];

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${firstArtist.name}*\n${name}\n${album.name}`,
      },
      accessory: {
        type: 'image',
        image_url: albumCover.url,
        alt_text: 'Album Cover',
      },
    });

    const hrefId = href.split('/');

    const value = {
      album: album.name,
      albumCover: albumCover.url,
      artist: firstArtist.name,
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

export default formatSlackTrackMessage;
