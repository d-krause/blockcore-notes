import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { Nip76Wallet, PostDocument, PrivateThread } from 'animiq-nip76-tools';
import { ApplicationState } from '../../services/applicationstate';
import { NostrProfileDocument } from '../../services/interfaces';
import { NavigationService } from '../../services/navigation';
import { UIService } from '../../services/ui';
import { Nip76Service } from '../nip76.service';
@Component({
  selector: 'app-nip76-settings',
  templateUrl: './nip76-settings.component.html',
  styleUrls: ['./nip76-settings.component.scss']
})
export class Nip76SettingsComponent {

  tabIndex?: number;
  showNoteForm = false;
  private _editThread: PrivateThread | null = null;
  activeThread: PrivateThread | undefined;
  isEmojiPickerVisible = false;
  @ViewChild('picker') picker: unknown;
  @ViewChild('noteContent') noteContent?: FormControl;
  noteForm = this.fb.group({
    content: ['', Validators.required],
    expiration: [''],
    dateControl: [],
  });
  get wallet(): Nip76Wallet {
    return this.nip76Service.wallet;
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    public navigation: NavigationService,
    public appState: ApplicationState,
    public ui: UIService,
    public nip76Service: Nip76Service,
    private fb: FormBuilder,
  ) { }

  async ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      this.tabIndex = this.activatedRoute.snapshot.data['tabIndex'] as number || 0;
      const activeThreadPubKey = params.get('threadPubKey');
      const thread = this.nip76Service.findThread(activeThreadPubKey!);
      if (thread) {
        this.activeThread = thread;
        if (this.tabIndex < 2) this.tabIndex = 3;
        if (this.tabIndex === 3 && !thread.notesSubscription) {
          this.nip76Service.loadNotes(this.activeThread);
        }
      }
    });
  }

  public trackByFn(index: number, item: PostDocument) {
    return item.a;
  }

  randomizeKey() {
    this.wallet.reKey();
    this.editThread = this.wallet.threads[0];
    this.editThread.decryptedContent.created_at = 1;
    this.editThread.decryptedContent.name = 'Example Thread 1';
    this.editThread.decryptedContent.description = 'My First Trace Resistant Thread 1';
    this.editThread.ready = true;
  }

  async saveConfiguration() {
    const savedLocal = await this.nip76Service.saveWallet();
    const savedRemote = await this.nip76Service.saveThread(this.editThread!);
    location.reload();
  }

  get editThread(): PrivateThread | null {
    return this._editThread!;
  }
  set editThread(value: PrivateThread | null) {
    this.cancelEdit();
    this._editThread = value;
  }

  onTabChanged(event: MatTabChangeEvent) {
    this.tabIndex = event.index;
    switch (event.index) {
      case 0:
        this.router.navigate(['/private-threads']);
        break;
      case 1:
        this.router.navigate(['/private-threads/following']);
        break;
      case 2:
        this.viewThreadFollowers(this.wallet.threads[0]);
        break;
      case 3:
        this.viewThreadNotes(this.wallet.threads[0]);
        break;
    }
  }

  viewThreadNotes(thread: PrivateThread) {
    this.router.navigate(['private-threads', thread.indexMap.post.ap.nostrPubKey, 'notes']);
  }

  viewThreadFollowers(thread: PrivateThread) {
    this.router.navigate(['private-threads', thread.indexMap.post.ap.nostrPubKey, 'followers']);
  }

  async copyKeys(thread: PrivateThread) {
    navigator.clipboard.writeText(await thread.getThreadPointer());
    this.snackBar.open(`Thread keys are now in your clipboard.`, 'Hide', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  async previewThread() {
    const thread = await this.nip76Service.previewThread();
    if (thread) {
      if (this.tabIndex != 3) {
        this.viewThreadNotes(thread);
      } else {
        this.activeThread = thread;
      }
    }
  }

  async follow(thread: PrivateThread) {
    this.nip76Service.saveFollowing(this.wallet.threads[0], thread)
    this.snackBar.open(`You are now following this thread.`, 'Hide', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  addThread() {
    this.cancelEdit();
    let firstAvailable = this.wallet.threads.find(x => !x.ready);
    if (!firstAvailable) {
      firstAvailable = this.wallet.getThread(this.wallet.threads.length);
    }
    firstAvailable.decryptedContent.created_at = 1;
    firstAvailable.ready = true;
    firstAvailable.decryptedContent.name = 'New Thread';
    this._editThread = firstAvailable;
  }

  cancelEdit() {
    if (this._editThread && this._editThread.decryptedContent.created_at === 1) {
      this._editThread.decryptedContent.created_at = undefined;
      this._editThread.ready = false;
    }
    this._editThread = null;
  }

  async saveThread() {
    this._editThread!.decryptedContent.created_at = undefined;
    const savedRemote = await this.nip76Service.saveThread(this._editThread!);
    if (savedRemote) {
      this._editThread = null;
    }
  }

  public addEmojiNote(event: { emoji: { native: any } }) {
    let startPos = (<any>this.noteContent).nativeElement.selectionStart;
    let value = this.noteForm.controls.content.value;

    let parsedValue = value?.substring(0, startPos) + event.emoji.native + value?.substring(startPos, value.length);
    this.noteForm.controls.content.setValue(parsedValue);
    this.isEmojiPickerVisible = false;

    (<any>this.noteContent).nativeElement.focus();
  }

  async saveNote() {
    if (await this.nip76Service.saveNote(this.activeThread!, this.noteForm.controls.content.value!)) {
      this.noteForm.reset();
      this.showNoteForm = false;
    }
  }
}
