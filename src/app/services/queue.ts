import { QueryJob } from './interfaces';

export class Queue {
  enqueProfile(identifier: string, callback?: any) {
    this.queues.profile.jobs.push({ identifier: identifier, type: 'Profile', callback: callback });
  }

  enqueEvent(identifier: string, callback?: any, limit?: number) {
    this.queues.event.jobs.push({ identifier: identifier, type: 'Event', callback: callback, limit: limit });
  }

  enqueContacts(identifier: string, callback?: any) {
    this.queues.contacts.jobs.push({ identifier: identifier, type: 'Contacts', callback: callback });
  }

  enque(identifier: string, type: 'Profile' | 'Event' | 'Contacts', limit?: number) {
    if (type === 'Profile') {
      this.enqueProfile(identifier);
    } else if (type === 'Event') {
      this.enqueEvent(identifier, undefined, limit);
    } else if (type === 'Contacts') {
      this.enqueContacts(identifier);
    }
  }

  queues = {
    profile: {
      active: false,
      jobs: [] as QueryJob[],
    },
    event: {
      active: false,
      jobs: [] as QueryJob[],
    },
    contacts: {
      active: false,
      jobs: [] as QueryJob[],
    },
  };
}
