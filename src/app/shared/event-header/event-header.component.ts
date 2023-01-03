import { Component, Input, ViewChild } from '@angular/core';
import { CirclesService } from 'src/app/services/circles.service';
import { ProfileService } from 'src/app/services/profile.service';
import { Utilities } from 'src/app/services/utilities.service';
import { Circle, NostrProfile, NostrProfileDocument } from '../../services/interfaces';

@Component({
  selector: 'app-event-header',
  templateUrl: './event-header.component.html',
  styleUrls: ['./event-header.component.css'],
})
export class EventHeaderComponent {
  @Input() pubkey: string = '';
  @Input() profile?: NostrProfileDocument;

  imagePath = '/assets/profile.png';
  tooltip = '';
  tooltipName = '';
  profileName = '';
  circle?: Circle;
  muted? = false;

  constructor(private profiles: ProfileService, private circleService: CirclesService, private utilities: Utilities) {}

  ngAfterViewInit() {}

  async ngOnInit() {
    if (!this.profile) {
      this.profile = await this.profiles.getProfile(this.pubkey);
      this.profileName = this.utilities.getNostrIdentifier(this.pubkey);

      if (!this.profile) {
        return;
      }
    } else {
      this.pubkey = this.profile.pubkey;
      this.profileName = this.utilities.getNostrIdentifier(this.profile.pubkey);
    }

    if (this.profile.picture) {
      this.imagePath = this.profile.picture;
    }

    this.tooltip = this.profile.about;
    this.tooltipName = this.profileName;

    // If the user has name in their profile, show that and not pubkey.
    this.profileName = this.profile.name || this.profileName;

    this.circle = await this.circleService.getCircle(this.profile.circle);

    this.muted = this.profile.mute;
  }
}