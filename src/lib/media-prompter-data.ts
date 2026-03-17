// Scripture mock data (used when Bible API key not configured)
// Format: reference -> text
export const MOCK_SCRIPTURES: Record<string, string> = {
  'John 3:16': 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
  'Psalm 23:1': 'The Lord is my shepherd, I lack nothing.',
  'Philippians 4:13': 'I can do all this through him who gives me strength.',
  'Romans 8:28': 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
  'Jeremiah 29:11': '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."',
  'Proverbs 3:5-6': 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
  'Matthew 11:28': 'Come to me, all you who are weary and burdened, and I will give you rest.',
  'Isaiah 40:31': 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
  'Psalm 46:1': 'God is our refuge and strength, an ever-present help in trouble.',
  'Romans 12:2': 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God\'s will is—his good, pleasing and perfect will.',
  '2 Corinthians 5:17': 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!',
  'Psalm 91:1': 'Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty.',
  'Matthew 28:19-20': 'Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you. And surely I am with you always, to the very end of the age.',
  'Ephesians 2:8-9': 'For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—not by works, so that no one can boast.',
  '1 Corinthians 13:4-7': 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs. Love does not delight in evil but rejoices with the truth. It always protects, always trusts, always hopes, always perseveres.',
}

// Common hymns for projection
export const HYMNS: { id: string; title: string; firstLine: string }[] = [
  { id: '1', title: 'Amazing Grace', firstLine: 'Amazing grace! How sweet the sound' },
  { id: '2', title: 'How Great Thou Art', firstLine: 'O Lord my God, when I in awesome wonder' },
  { id: '3', title: 'Blessed Assurance', firstLine: 'Blessed assurance, Jesus is mine!' },
  { id: '4', title: 'Great Is Thy Faithfulness', firstLine: 'Great is Thy faithfulness, O God my Father' },
  { id: '5', title: 'It Is Well With My Soul', firstLine: 'When peace like a river attendeth my way' },
  { id: '6', title: 'What a Friend We Have in Jesus', firstLine: 'What a friend we have in Jesus' },
  { id: '7', title: 'Holy, Holy, Holy', firstLine: 'Holy, holy, holy! Lord God Almighty!' },
  { id: '8', title: 'The Old Rugged Cross', firstLine: 'On a hill far away stood an old rugged cross' },
  { id: '9', title: 'In Christ Alone', firstLine: 'In Christ alone my hope is found' },
  { id: '10', title: 'Be Thou My Vision', firstLine: 'Be Thou my Vision, O Lord of my heart' },
  { id: '11', title: 'How Deep the Father\'s Love', firstLine: 'How deep the Father\'s love for us' },
  { id: '12', title: 'Come Thou Fount', firstLine: 'Come, Thou Fount of every blessing' },
  { id: '13', title: 'A Mighty Fortress Is Our God', firstLine: 'A mighty fortress is our God' },
  { id: '14', title: 'All Hail the Power of Jesus\' Name', firstLine: 'All hail the power of Jesus\' name!' },
  { id: '15', title: 'Crown Him With Many Crowns', firstLine: 'Crown Him with many crowns' },
  { id: '16', title: 'To God Be the Glory', firstLine: 'To God be the glory, great things He has done!' },
  { id: '17', title: 'Rock of Ages', firstLine: 'Rock of Ages, cleft for me' },
  { id: '18', title: 'Nearer My God to Thee', firstLine: 'Nearer, my God, to Thee' },
  { id: '19', title: 'O Come All Ye Faithful', firstLine: 'O come, all ye faithful' },
  { id: '20', title: 'Hark! The Herald Angels Sing', firstLine: 'Hark! The herald angels sing' },
  { id: '21', title: 'Joy to the World', firstLine: 'Joy to the world! The Lord is come' },
  { id: '22', title: 'Because He Lives', firstLine: 'God sent His son, they called Him Jesus' },
  { id: '23', title: 'Shout to the Lord', firstLine: 'My Jesus, my Saviour' },
  { id: '24', title: 'Open the Eyes of My Heart', firstLine: 'Open the eyes of my heart, Lord' },
  { id: '25', title: 'Here I Am to Worship', firstLine: 'Light of the world, You stepped down into darkness' },
]

const RECENT_KEY = 'grace-cms-media-recent'
const FAVOURITES_KEY = 'grace-cms-media-favourites'
const MAX_RECENT = 10

export type PrompterItem = { type: 'scripture'; ref: string; text: string } | { type: 'hymn'; id: string; title: string; firstLine: string }

export function getRecentItems(): PrompterItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function itemKey(item: PrompterItem): string {
  return item.type === 'scripture' ? `s:${item.ref}` : `h:${item.id}`
}

export function addToRecent(item: PrompterItem) {
  const recent = getRecentItems()
  const key = itemKey(item)
  const filtered = recent.filter((r) => itemKey(r) !== key)
  const updated = [item, ...filtered].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

export function getFavourites(): string[] {
  try {
    const raw = localStorage.getItem(FAVOURITES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function toggleFavourite(id: string) {
  const favs = getFavourites()
  const has = favs.includes(id)
  const updated = has ? favs.filter((f) => f !== id) : [...favs, id]
  localStorage.setItem(FAVOURITES_KEY, JSON.stringify(updated))
  return !has
}

export function isFavourite(id: string): boolean {
  return getFavourites().includes(id)
}
